import { Body, Controller, Post } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorProfileDto, CreateVendorServiceDto } from './dto/vendor.dto';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('profile')
  async createProfile(@Body() dto: CreateVendorProfileDto) {
    return this.vendorsService.createProfile(dto);
  }

  @Post('services')
  async createService(@Body() dto: CreateVendorServiceDto) {
    return this.vendorsService.createService(dto);
  }
}
