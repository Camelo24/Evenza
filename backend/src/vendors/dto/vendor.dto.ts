import { IsString, IsNumber, Min, MaxLength, MinLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVendorProfileDto {
  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsString()
  @MinLength(8)
  tagline!: string;

  @IsString()
  @MinLength(30)
  description!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(3)
  address!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  startingPrice!: number;

  @IsString()
  imageUrl!: string;

  @IsString()
  coverUrl!: string;
}

export class CreateVendorServiceDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationHours!: number;
}
