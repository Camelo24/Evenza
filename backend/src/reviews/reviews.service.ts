import { Injectable } from '@nestjs/common';
import { submitReview } from './actions';
import type { SubmitReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  async submit(dto: SubmitReviewDto) {
    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    return submitReview({ ok: true, message: '' }, formData);
  }
}
