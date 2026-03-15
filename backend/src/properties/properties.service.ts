import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument, PropertyStatus } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UserRole, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PropertiesService {
  constructor(@InjectModel(Property.name) private propertyModel: Model<PropertyDocument>) {}

  private normalizeImages<T extends { mainImage?: string; images?: string[] }>(payload: T): T {
    const next = { ...payload };

    if (!next.mainImage && next.images && next.images.length > 0) {
      next.mainImage = next.images[0];
    }

    if (next.mainImage && next.images) {
      next.images = [next.mainImage, ...next.images.filter((image) => image !== next.mainImage)];
    }

    return next;
  }

  async create(dto: CreatePropertyDto, owner: UserDocument): Promise<Property> {
    const payload = this.normalizeImages(dto);
    const property = new this.propertyModel({ ...payload, owner: owner._id });
    return property.save();
  }

  async findAll(query: { city?: string; minPrice?: number; maxPrice?: number; guests?: number }) {
    const filter: any = { status: PropertyStatus.APPROVED };
    if (query.city) filter['location.city'] = new RegExp(query.city, 'i');
    if (query.minPrice || query.maxPrice) {
      filter.pricePerNight = {};
      if (query.minPrice) filter.pricePerNight.$gte = query.minPrice;
      if (query.maxPrice) filter.pricePerNight.$lte = query.maxPrice;
    }
    if (query.guests) filter.maxGuests = { $gte: query.guests };
    return this.propertyModel.find(filter).populate('owner', 'name email').exec();
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).populate('owner', 'name email');
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async findByOwner(ownerId: string) {
    return this.propertyModel.find({ owner: new Types.ObjectId(ownerId) });
  }

  async updateStatus(id: string, status: PropertyStatus): Promise<Property> {
    const property = await this.propertyModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, dto: Partial<CreatePropertyDto>, user: UserDocument): Promise<Property> {
  const property = await this.findOne(id);

  // Cast to any to safely extract the id whether populated or not
  const ownerId = (property.owner as any)?._id?.toString() ?? property.owner.toString();

  if (ownerId !== user._id.toString() && user.role !== UserRole.ADMIN) {
    throw new ForbiddenException('Not authorized');
  }

  const payload = this.normalizeImages(dto);
  const updatedProperty = await this.propertyModel.findByIdAndUpdate(id, payload, { new: true });
  if (!updatedProperty) throw new NotFoundException('Property not found');
  return updatedProperty;
}

  async delete(id: string, user: UserDocument): Promise<void> {
    const property = await this.findOne(id);
    if (property.owner.toString() !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not authorized');
    }
    await this.propertyModel.findByIdAndDelete(id);
  }

  async blockDates(id: string, dates: Date[], user: UserDocument): Promise<Property> {
    const property = await this.findOne(id);
    if (property.owner.toString() !== user._id.toString()) throw new ForbiddenException();
    const updatedProperty = await this.propertyModel.findByIdAndUpdate(
      id,
      { $addToSet: { blockedDates: { $each: dates } } },
      { new: true },
    );
    if (!updatedProperty) throw new NotFoundException('Property not found');
    return updatedProperty;
  }
}