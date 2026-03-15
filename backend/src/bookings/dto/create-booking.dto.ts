import { Type } from 'class-transformer';
import { IsDate, IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

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
}