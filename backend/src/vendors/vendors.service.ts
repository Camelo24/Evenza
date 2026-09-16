import { Injectable } from '@nestjs/common';
import { createVendorProfile, createVendorService } from './actions';
import type { CreateVendorProfileDto, CreateVendorServiceDto } from './dto/vendor.dto';

@Injectable()
export class VendorsService {
  async createProfile(dto: CreateVendorProfileDto) {
    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    return createVendorProfile({ ok: true, message: '' }, formData);
  }

  async createService(dto: CreateVendorServiceDto) {
    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    return createVendorService({ ok: true, message: '' }, formData);
  }
}
