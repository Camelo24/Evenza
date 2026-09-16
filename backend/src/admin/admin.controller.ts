import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ReviewAccessRequestDto } from './dto/review-access-request.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Post('access-requests/:id/review')
  async reviewAccessRequest(@Param('id') id: string, @Body() dto: ReviewAccessRequestDto) {
    return this.adminService.reviewAccessRequest({ ...dto, id });
  }
}
