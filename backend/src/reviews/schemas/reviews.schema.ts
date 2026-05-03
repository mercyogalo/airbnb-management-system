import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  property: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, minlength: 10, maxlength: 1000 })
  comment: string;

  // Denormalised guest name so it renders without a populate on every request
  @Prop({ required: true })
  guestName: string;

  @Prop()
  guestAvatar?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// One review per guest per property
ReviewSchema.index({ guest: 1, property: 1 }, { unique: true });
ReviewSchema.index({ property: 1, createdAt: -1 });