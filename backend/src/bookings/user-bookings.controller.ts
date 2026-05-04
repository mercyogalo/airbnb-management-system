import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { BookingsService } from './bookings.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserBookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get('bookings')
  myBookings(@CurrentUser() user: UserDocument) {
    return this.bookingsService.findAllByGuest(user._id.toString());
  }
}
