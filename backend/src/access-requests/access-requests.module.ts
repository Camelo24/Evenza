import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('access-requests')
export class AccessRequestsController {}

@Injectable()
export class AccessRequestsService {}

@Module({
  controllers: [AccessRequestsController],
  providers: [AccessRequestsService],
  exports: [AccessRequestsService],
})
export class AccessRequestsModule {}


