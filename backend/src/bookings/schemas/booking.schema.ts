import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  AWAITING_PAYMENT = 'awaiting_payment', // created, STK push sent
  CONFIRMED        = 'confirmed',         // payment verified
  CANCELLED        = 'cancelled',
  COMPLETED        = 'completed',
  EXPIRED          = 'expired',           // payment never came through
}

export enum PaymentMethod {
  MPESA = 'mpesa',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  property: Types.ObjectId;

  @Prop({ required: true })
  checkIn: Date;

  @Prop({ required: true })
  checkOut: Date;

  @Prop({ required: true, min: 1 })
  guests: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.AWAITING_PAYMENT })
  status: BookingStatus;

  @Prop()
  specialRequests?: string;

  @Prop({ required: true })
  guestPhone: string;

  @Prop({ required: true })
  guestEmail: string;

  @Prop({ required: true })
  guestName: string;

  // ── Payment tracking ───────────────────────────────────────────
  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @Prop()
  paymentReference?: string;   

  @Prop()
  transactionId?: string;     

  @Prop()
  paidAt?: Date;

  // Auto-expire: set when booking is created, checked by a cron/TTL
  @Prop({ default: () => new Date(Date.now() + 30 * 60 * 1000) }) // 30 min window
  paymentDeadline: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ guest: 1 });
BookingSchema.index({ paymentReference: 1 });
BookingSchema.index({ paymentDeadline: 1 }, { expireAfterSeconds: 0 }); // TTL handled manually