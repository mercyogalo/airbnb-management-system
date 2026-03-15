import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { BookingStatus } from './schemas/booking.schema';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: UserDocument) {
    return this.bookingsService.create(dto, user);
  }

  // Real-time availability check — called from the booking form before submit
  @Get('availability')
  checkAvailability(
    @Query('propertyId') propertyId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.bookingsService.checkAvailability(
      propertyId,
      new Date(checkIn),
      new Date(checkOut),
    );
  }

  @Get('my')
  myBookings(@CurrentUser() user: UserDocument) {
    return this.bookingsService.findAllByGuest(user._id.toString());
  }

  @Get('property/:propertyId')
  propertyBookings(@Param('propertyId') propertyId: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.findAllByProperty(propertyId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.findOne(id, user);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.updateStatus(id, status, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.delete(id, user);
  }
}