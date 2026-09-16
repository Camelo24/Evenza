import { Injectable } from '@nestjs/common';
import type { Session } from '@backend/auth/session';
import { purchaseTicket } from './actions';
import type { PurchaseTicketDto } from './dto/purchase-ticket.dto';

@Injectable()
export class TicketsService {
  async purchaseTicket(session: Session, dto: PurchaseTicketDto) {
    const formData = new FormData();
    formData.set('eventId', dto.eventId);
    formData.set('quantity', String(dto.quantity));
    formData.set('phoneNumber', dto.phoneNumber);

    return purchaseTicket({ ok: true, message: '' }, formData);
  }
}
