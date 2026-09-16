import { Module } from '@nestjs/common';
import { VendorsController } from './vendor.controller';
import { VendorsService } from './vendors.service';

@Module({
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
