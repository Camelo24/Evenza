import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class PurchaseTicketDto {
  @IsString()
  eventId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @IsString()
  @Matches(/^(\+?237)?[26]\d{8}$/, { message: 'Enter a valid Cameroonian mobile number.' })
  phoneNumber!: string;
}
