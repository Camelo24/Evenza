import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { RolesGuard } from '@backend/common/guards/roles.guard';
import { requireRole } from '@backend/auth/session';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(new RolesGuard(['organiser']))
  async create(@Body() dto: CreateEventDto) {
    const session = await requireRole('organiser');
    return this.eventsService.createEvent(session, dto);
  }

  @Delete(':id')
  @UseGuards(new RolesGuard(['organiser']))
  async delete(@Param('id') id: string) {
    const session = await requireRole('organiser');
    return this.eventsService.deleteEvent(session, id);
  }
}
