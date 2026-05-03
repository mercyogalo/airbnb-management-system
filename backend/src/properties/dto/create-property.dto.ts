import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { BlockType } from '../schemas/property.schema';

class LocationDto {
  @IsNotEmpty() @IsString() address: string;
  @IsNotEmpty() @IsString() city: string;
  @IsNotEmpty() @IsString() country: string;
}

export class BlockedPeriodDto {
  @IsDate()
  @Type(() => Date)
  start: Date;

  @IsDate()
  @Type(() => Date)
  end: Date;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(BlockType)
  type: BlockType;
}

export class CreatePropertyDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() description: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsNumber() @Min(1) pricePerNight: number;
  @IsNumber() @Min(1) maxGuests: number;
  @IsNumber() @Min(1) bedrooms: number;
  @IsNumber() @Min(1) bathrooms: number;

  @IsOptional() @IsString() mainImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) rules?: string[];

  // e.g. ['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'Hot Tub']
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
}

export class AddBlockedPeriodDto {
  @ValidateNested({ each: true })
  @Type(() => BlockedPeriodDto)
  @IsArray()
  periods: BlockedPeriodDto[];
}

export class RemoveBlockedPeriodDto {
  @IsArray()
  @IsString({ each: true })
  periodIds: string[];
}