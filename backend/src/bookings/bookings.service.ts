import { Injectable } from '@nestjs/common';
import type { Session } from '@backend/auth/session';
import { createBooking, sendBookingMessage, serviceProviderBookingDecision } from './actions';
import type { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  async createBooking(session: Session, dto: CreateBookingDto) {
    const formData = new FormData();
    formData.set('vendorId', dto.vendorId);
    formData.set('serviceId', dto.serviceId);
    formData.set('eventType', dto.eventType);
    formData.set('eventDate', dto.eventDate);
    formData.set('venue', dto.venue);
    formData.set('guestCount', String(dto.guestCount));
    if (dto.notes) formData.set('notes', dto.notes);
    formData.set('escrowMode', dto.escrowMode);
    formData.set('depositPercent', String(dto.depositPercent));
    formData.set('phoneNumber', dto.phoneNumber);
    formData.set('termsAccepted', dto.termsAccepted);

    return createBooking({ ok: true, message: '' }, formData);
  }

  async decide(session: Session, bookingId: string, decision: 'confirmed' | 'rejected') {
    const formData = new FormData();
    formData.set('bookingId', bookingId);
    formData.set('decision', decision);

    return serviceProviderBookingDecision(formData);
  }

  async sendMessage(session: Session, bookingId: string, body?: string, attachment?: File | null) {
    const formData = new FormData();
    formData.set('bookingId', bookingId);
    formData.set('body', body ?? '');
    if (attachment) formData.set('attachment', attachment);

    return sendBookingMessage(formData);
  }
}
