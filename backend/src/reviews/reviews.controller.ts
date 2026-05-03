import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // Authenticated guest — submit a review
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: UserDocument) {
    return this.reviewsService.create(dto, user);
  }

  // Public — get reviews for a property
  @Get('property/:propertyId')
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.reviewsService.findByProperty(propertyId);
  }

  // Admin — remove inappropriate reviews
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.reviewsService.delete(id);
  }
}