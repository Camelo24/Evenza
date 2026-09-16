import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { requireRole } from '@backend/auth/session';
import { RolesGuard } from '@backend/common/guards/roles.guard';
import { TicketsService } from './tickets.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(new RolesGuard(['client']))
  async purchase(@Body() dto: PurchaseTicketDto) {
    const session = await requireRole('client');
    return this.ticketsService.purchaseTicket(session, dto);
  }
}
