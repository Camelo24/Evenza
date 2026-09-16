import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {}

@Injectable()
export class PaymentsService {}

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
