import { Type } from 'class-transformer';
import { IsBooleanString, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  vendorId!: string;

  @IsString()
  serviceId!: string;

  @IsString()
  @MinLength(2)
  eventType!: string;

  @IsString()
  eventDate!: string;

  @IsString()
  @MinLength(3)
  venue!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;

  @IsEnum(['full', 'deposit'])
  escrowMode!: 'full' | 'deposit';

  @Type(() => Number)
  @IsInt()
  @Min(20)
  depositPercent!: number;

  @IsString()
  @Matches(/^(\+?237)?[26]\d{8}$/, { message: 'Enter a valid Cameroonian mobile number.' })
  phoneNumber!: string;

  @IsBooleanString()
  termsAccepted!: string;
}
