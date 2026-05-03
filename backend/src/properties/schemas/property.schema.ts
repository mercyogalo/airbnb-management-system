import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum BlockType {
  FULL_DAY = 'full_day',
  TIME_RANGE = 'time_range',
}

@Schema({ _id: false })
export class BlockedPeriod {
  @Prop({ required: true })
  start: Date;

  @Prop({ required: true })
  end: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: String, enum: BlockType, required: true })
  type: BlockType;
}

const BlockedPeriodSchema = SchemaFactory.createForClass(BlockedPeriod);

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: {
      address: String,
      city: String,
      country: String,
      coordinates: { lat: Number, lng: Number },
    },
    required: true,
  })
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };

  @Prop({ required: true })
  pricePerNight: number;

  @Prop({ default: '' })
  mainImage: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  rules: string[];

  // ── New fields ─────────────────────────────────────────────────
  @Prop({ type: [String], default: [] })
  amenities: string[];          // e.g. ['WiFi', 'Pool', 'Parking', 'Air Conditioning']

  @Prop({ required: true, min: 1 })
  bedrooms: number;

  @Prop({ required: true, min: 1 })
  bathrooms: number;

  @Prop({ required: true })
  maxGuests: number;

  @Prop({ type: String, enum: PropertyStatus, default: PropertyStatus.ACTIVE })
  status: PropertyStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  // ── Blocked periods (replaces flat blockedDates[]) ─────────────
  @Prop({ type: [BlockedPeriodSchema], default: [] })
  blockedPeriods: BlockedPeriod[];
}

export const PropertySchema = SchemaFactory.createForClass(Property);

PropertySchema.index({ 'location.city': 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ owner: 1 });