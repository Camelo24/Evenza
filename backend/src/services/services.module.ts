import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('services')
export class ServicesController {}

@Injectable()
export class ServicesService {}

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
