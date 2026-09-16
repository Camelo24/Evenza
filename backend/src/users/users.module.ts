import { Controller, Injectable, Module } from '@nestjs/common';

@Controller('users')
export class UsersController {}

@Injectable()
export class UsersService {}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
