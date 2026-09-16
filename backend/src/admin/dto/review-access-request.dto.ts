export class ReviewAccessRequestDto {
  decision!: 'approved' | 'rejected';
  reviewNote?: string;
}
