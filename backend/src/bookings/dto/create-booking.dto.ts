import { Type } from 'class-transformer';
import { IsDate, IsInt, IsMongoId, IsOptional, IsString, Min, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  propertyId: string;

  @IsDate()
  @Type(() => Date)
  checkIn: Date;

  @IsDate()
  @Type(() => Date)
  checkOut: Date;

  @IsInt()
  @Min(1)
  guests: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, {
    message: 'Please provide a valid phone number.',
  })
  guestPhone: string;
}