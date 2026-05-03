import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MpesaService } from './mpesa.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name,   schema: PaymentSchema },
      { name: Booking.name,   schema: BookingSchema },
      { name: Property.name,  schema: PropertySchema },
    ]),
    MailModule,
  ],
  providers: [PaymentsService, MpesaService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}