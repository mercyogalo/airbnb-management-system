import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

export enum PropertyStatus {
  PENDING = 'pending',     // awaiting admin verification
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: { address: String, city: String, country: String, coordinates: { lat: Number, lng: Number } }, required: true })
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

  @Prop({ required: true })
  maxGuests: number;

  @Prop({ type: String, enum: PropertyStatus, default: PropertyStatus.PENDING })
  status: PropertyStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  // Dates blocked from booking (owner-managed)
  @Prop({ type: [Date], default: [] })
  blockedDates: Date[];
}

export const PropertySchema = SchemaFactory.createForClass(Property);
// Index for geo/search queries
PropertySchema.index({ 'location.city': 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ owner: 1 });