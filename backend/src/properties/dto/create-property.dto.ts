import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class LocationDto {
  @IsNotEmpty() @IsString() address: string;
  @IsNotEmpty() @IsString() city: string;
  @IsNotEmpty() @IsString() country: string;
}

export class CreatePropertyDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() description: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsNumber() @Min(1) pricePerNight: number;
  @IsNumber() @Min(1) maxGuests: number;

  @IsOptional() @IsString() mainImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) rules?: string[];
}