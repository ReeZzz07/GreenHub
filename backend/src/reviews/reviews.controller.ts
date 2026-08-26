import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/review')
  create(
    @Param('orderId') orderId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reviewsService.create(orderId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:id/reply')
  reply(@Param('id') id: string, @Body() dto: ReplyReviewDto, @CurrentUser() user: { id: string }) {
    return this.reviewsService.reply(id, user.id, dto);
  }

  @Get('sellers/:id')
  getSeller(@Param('id') id: string) {
    return this.reviewsService.getSellerSummary(id);
  }

  @Get('sellers/:id/reviews')
  getSellerReviews(@Param('id') id: string) {
    return this.reviewsService.findForSeller(id);
  }
}
