import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ── Guest: initiate payment for their booking ─────────────────
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  initiatePayment(@Body() dto: InitiatePaymentDto, @CurrentUser() user: UserDocument) {
    return this.paymentsService.initiatePayment(dto, user);
  }

  // ── M-Pesa Daraja callback (public — called by Safaricom) ─────
  // Safaricom POSTs to this URL — no auth header from their side
  @Post('mpesa/callback')
  @HttpCode(200)
  async mpesaCallback(@Body() payload: any) {
    await this.paymentsService.handleMpesaCallback(payload);
    // Daraja expects this exact shape
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  // ── Admin: list all payments 
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.paymentsService.findAll();
  }

  // ── Admin / guest: payments for a booking 
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }
}