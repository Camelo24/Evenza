import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(2)
  eventType!: string;

  @IsString()
  @MinLength(3)
  venue!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  startsAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount!: number;

  @IsEnum(['private', 'public'])
  visibility!: 'private' | 'public';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ticketPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
