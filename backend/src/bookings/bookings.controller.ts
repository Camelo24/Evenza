import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { requireRole } from '@backend/auth/session';
import { RolesGuard } from '@backend/common/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(new RolesGuard(['organiser']))
  async create(@Body() dto: CreateBookingDto) {
    const session = await requireRole('organiser');
    return this.bookingsService.createBooking(session, dto);
  }

  @Post('decision/:bookingId')
  @UseGuards(new RolesGuard(['service_provider']))
  async decision(@Param('bookingId') bookingId: string, @Body('decision') decision: 'confirmed' | 'rejected') {
    const session = await requireRole('service_provider');
    return this.bookingsService.decide(session, bookingId, decision);
  }

  @Post('messages')
  @UseGuards(new RolesGuard(['organiser', 'service_provider']))
  async sendMessage(@Body() body: { bookingId: string; body?: string }) {
    const session = await requireRole('organiser', 'service_provider');
    return this.bookingsService.sendMessage(session, body.bookingId, body.body ?? '');
  }
}
