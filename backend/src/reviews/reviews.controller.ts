import { Body, Controller, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async submit(@Body() dto: SubmitReviewDto) {
    return this.reviewsService.submit(dto);
  }
}
