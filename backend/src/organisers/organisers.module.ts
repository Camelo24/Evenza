import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('organisers')
export class OrganisersController {}

@Injectable()
export class OrganisersService {}

@Module({
  controllers: [OrganisersController],
  providers: [OrganisersService],
  exports: [OrganisersService],
})
export class OrganisersModule {}
