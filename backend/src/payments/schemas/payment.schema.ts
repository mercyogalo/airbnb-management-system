import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING   = 'pending',
  SUCCESS   = 'success',
  FAILED    = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentProvider {
  MPESA = 'mpesa',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guest: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'KES' })
  currency: string;

  @Prop({ type: String, enum: PaymentProvider, required: true })
  provider: PaymentProvider;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

 
  @Prop()
  checkoutRequestId?: string;  // M-Pesa STK push ID

  @Prop()
  merchantRequestId?: string;  // M-Pesa

  @Prop()
  mpesaReceiptNumber?: string; // M-Pesa confirmation code

  @Prop()
  rawCallbackPayload?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  paidAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ checkoutRequestId: 1 });
PaymentSchema.index({ status: 1 });