import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('escrow')
export class EscrowController {}

@Injectable()
export class EscrowService {}

@Module({
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
