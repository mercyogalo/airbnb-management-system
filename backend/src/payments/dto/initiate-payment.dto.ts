import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsMongoId()
  bookingId: string;

  // Required for M-Pesa — the phone to push STK to (format: 254XXXXXXXXX)
  @IsString()
  @IsNotEmpty()
  phone?: string;
}