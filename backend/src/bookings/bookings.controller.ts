import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/schemas/user.schema';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // Guest: create booking (triggers payment window)
  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: UserDocument) {
    return this.bookingsService.create(dto, user);
  }

  // Public availability check (property detail page, browse before login)
  @Public()
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

  // Guest: my bookings
  @Get('my')
  myBookings(@CurrentUser() user: UserDocument) {
    return this.bookingsService.findAllByGuest(user._id.toString());
  }

  // Admin: all bookings across all properties
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.bookingsService.findAll();
  }

  // Owner/admin: bookings for a specific property
  @Get('property/:propertyId')
  propertyBookings(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.findAllByProperty(propertyId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.findOne(id, user);
  }

  // Admin: mark completed after guest checks out
  @Put(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  markCompleted(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.markCompleted(id, user);
  }

  // Guest or admin: cancel a booking
  @Put(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.cancel(id, user);
  }

  // Guest: delete unpaid/expired/cancelled booking record
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.bookingsService.delete(id, user);
  }
}