import { Body, Controller, Post } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { RaiseDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('raise')
  async raise(@Body() dto: RaiseDisputeDto) {
    return this.disputesService.raise(dto);
  }

  @Post('resolve')
  async resolve(@Body() dto: ResolveDisputeDto) {
    return this.disputesService.resolve(dto);
  }
}
