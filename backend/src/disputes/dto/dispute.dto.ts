import { IsOptional, IsString, MinLength } from 'class-validator';

export class RaiseDisputeDto {
  @IsString()
  bookingId!: string;

  @IsString()
  @MinLength(3)
  reason!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class ResolveDisputeDto {
  @IsString()
  disputeId!: string;

  @IsString()
  decision!: 'vendor' | 'organiser' | 'split';

  @IsString()
  @MinLength(10)
  resolutionNote!: string;

  @IsOptional()
  vendorShare?: number;

  @IsOptional()
  organiserRefund?: number;
}
