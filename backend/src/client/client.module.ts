import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('client')
export class ClientController {}

@Injectable()
export class ClientService {}

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
