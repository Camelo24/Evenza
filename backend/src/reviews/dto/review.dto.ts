import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class SubmitReviewDto {
  @IsString()
  bookingId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(6)
  comment!: string;
}
