import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument, PropertyStatus, BlockType } from './schemas/property.schema';
import { CreatePropertyDto, AddBlockedPeriodDto } from './dto/create-property.dto';
import { UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
  ) {}

  private normalizeImages<T extends { mainImage?: string; images?: string[] }>(payload: T): T {
    const next = { ...payload };
    if (!next.mainImage && next.images?.length) next.mainImage = next.images[0];
    if (next.mainImage && next.images) {
      next.images = [next.mainImage, ...next.images.filter((img) => img !== next.mainImage)];
    }
    return next;
  }

  // ── Create — auto-approved (single owner system) ──────────────
  async create(dto: CreatePropertyDto, owner: UserDocument): Promise<Property> {
    const payload = this.normalizeImages(dto);
    const property = new this.propertyModel({
      ...payload,
      owner: owner._id,
      status: PropertyStatus.ACTIVE,   // auto-active, no approval needed
    });
    return property.save();
  }

  // ── Public listing — active properties only ───────────────────
  async findAll(query: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    checkIn?: Date;
    checkOut?: Date;
  }) {
    const filter: any = { status: PropertyStatus.ACTIVE };

    if (query.city)     filter['location.city'] = new RegExp(query.city, 'i');
    if (query.minPrice || query.maxPrice) {
      filter.pricePerNight = {};
      if (query.minPrice) filter.pricePerNight.$gte = query.minPrice;
      if (query.maxPrice) filter.pricePerNight.$lte = query.maxPrice;
    }
    if (query.guests)   filter.maxGuests = { $gte: query.guests };

    return this.propertyModel.find(filter).populate('owner', 'name email').exec();
  }

  // ── Admin — all properties ────────────────────────────────────
  async findAllForAdmin(query: { status?: PropertyStatus } = {}) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    return this.propertyModel
      .find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).populate('owner', 'name email');
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async findByOwner(ownerId: string) {
    return this.propertyModel.find({ owner: new Types.ObjectId(ownerId) });
  }

  async update(id: string, dto: Partial<CreatePropertyDto>, user: UserDocument): Promise<Property> {
    const property = await this.findOne(id);
    const ownerId  = (property.owner as any)?._id?.toString() ?? property.owner.toString();

    if (ownerId !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    const payload = this.normalizeImages(dto);
    const updated = await this.propertyModel.findByIdAndUpdate(id, payload, { returnDocument: 'after' });
    if (!updated) throw new NotFoundException('Property not found');
    return updated;
  }

  async delete(id: string, user: UserDocument): Promise<void> {
    const property = await this.findOne(id);
    const ownerId  = (property.owner as any)?._id?.toString() ?? property.owner.toString();

    if (ownerId !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    await this.propertyModel.findByIdAndDelete(id);
  }

  // ── Toggle active/inactive (replaces status approval flow) ────
  async setStatus(id: string, status: PropertyStatus): Promise<Property> {
    const property = await this.propertyModel.findByIdAndUpdate(
      id, { status }, { returnDocument: 'after' },
    );
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  // ── Add blocked periods (full_day or time_range) ───────────────
  async addBlockedPeriods(id: string, dto: AddBlockedPeriodDto, user: UserDocument): Promise<Property> {
    const property = await this.findOne(id);
    const ownerId  = (property.owner as any)?._id?.toString() ?? property.owner.toString();

    if (ownerId !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    // Validate: start must be before end
    for (const period of dto.periods) {
      if (period.start >= period.end) {
        throw new BadRequestException(
          `Blocked period start (${period.start.toISOString()}) must be before end (${period.end.toISOString()})`,
        );
      }
    }

    const updated = await this.propertyModel.findByIdAndUpdate(
      id,
      { $push: { blockedPeriods: { $each: dto.periods } } },
      { returnDocument: 'after' },
    );
    if (!updated) throw new NotFoundException('Property not found');
    return updated;
  }

  // ── Remove blocked periods by their subdocument _id ───────────
  async removeBlockedPeriods(id: string, periodIds: string[], user: UserDocument): Promise<Property> {
    const property = await this.findOne(id);
    const ownerId  = (property.owner as any)?._id?.toString() ?? property.owner.toString();

    if (ownerId !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }

    const updated = await this.propertyModel.findByIdAndUpdate(
      id,
      {
        $pull: {
          blockedPeriods: {
            _id: { $in: periodIds.map((pid) => new Types.ObjectId(pid)) },
          },
        },
      },
      { returnDocument: 'after' },
    );
    if (!updated) throw new NotFoundException('Property not found');
    return updated;
  }

  // ── Check if a date range overlaps any blocked period ─────────
  // Used by BookingsService before creating a booking
  isDateRangeBlocked(property: PropertyDocument, checkIn: Date, checkOut: Date): boolean {
    return property.blockedPeriods.some((period) => {
      // Overlap: period.start < checkOut AND period.end > checkIn
      return period.start < checkOut && period.end > checkIn;
    });
  }
}