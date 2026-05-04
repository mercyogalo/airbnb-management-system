import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentProvider, PaymentStatus } from './schemas/payment.schema';
import { Booking, BookingDocument, BookingStatus, PaymentMethod } from '../bookings/schemas/booking.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { MpesaService } from './mpesa.service';
import { MailService } from '../mail/mail.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { UserDocument } from '../users/schemas/user.schema';

type PopulatedBookingDocument = Omit<BookingDocument, 'property'> & {
  property: PropertyDocument;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private mpesaService: MpesaService,
    private mailService: MailService,
  ) {}

  // ── Initiate payment for a booking ────────────────────────────
  async initiatePayment(dto: InitiatePaymentDto, user: UserDocument) {
    const booking = await this.bookingModel
      .findById(dto.bookingId)
      .populate<{ property: PropertyDocument }>('property');

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.guest.toString() !== user._id.toString()) {
      throw new BadRequestException('This booking does not belong to you');
    }

    if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
      throw new BadRequestException(`Booking is already ${booking.status}`);
    }

    if (new Date() > booking.paymentDeadline) {
      booking.status = BookingStatus.EXPIRED;
      await booking.save();
      throw new BadRequestException('Payment window expired. Please create a new booking.');
    }

    const populatedBooking = booking as PopulatedBookingDocument;
    return this.initiateMpesa(populatedBooking, dto, user);
  }

  // M-Pesa STK Push
  private async initiateMpesa(
    booking: PopulatedBookingDocument,
    dto: InitiatePaymentDto,
    user: UserDocument,
  ) {
    if (!dto.phone) throw new BadRequestException('Phone number required for M-Pesa');

    const { checkoutRequestId, merchantRequestId } = await this.mpesaService.initiateSTKPush({
      phone: dto.phone,
      amount: booking.totalPrice,
      bookingId: booking._id.toString(),
      accountReference: booking._id.toString().substring(0, 12),
      description: `Booking payment`,
    });

    // Record the pending payment
    await this.paymentModel.create({
      booking: booking._id,
      guest: user._id,
      amount: booking.totalPrice,
      currency: 'KES',
      provider: PaymentProvider.MPESA,
      status: PaymentStatus.PENDING,
      checkoutRequestId,
      merchantRequestId,
    });

    // Update booking with payment ref
    booking.paymentMethod    = PaymentMethod.MPESA;
    booking.paymentReference = checkoutRequestId;
    await booking.save();

    return {
      message: 'STK Push sent. Please check your phone and enter your M-Pesa PIN.',
      checkoutRequestId,
    };
  }

  // ── M-Pesa Daraja Callback ─────────────────────────────────────
  async handleMpesaCallback(payload: any): Promise<void> {
    const stk = payload?.Body?.stkCallback;
    if (!stk) return;

    const checkoutRequestId = stk.CheckoutRequestID;
    const resultCode        = stk.ResultCode;

    const payment = await this.paymentModel.findOne({ checkoutRequestId });
    if (!payment) {
      this.logger.warn(`M-Pesa callback for unknown checkoutRequestId: ${checkoutRequestId}`);
      return;
    }

    payment.rawCallbackPayload = JSON.stringify(payload);

    if (resultCode === 0) {
      const items: any[] = stk.CallbackMetadata?.Item ?? [];
      const get = (name: string) => items.find((i: any) => i.Name === name)?.Value;

      payment.status             = PaymentStatus.SUCCESS;
      payment.mpesaReceiptNumber = get('MpesaReceiptNumber');
      payment.paidAt             = new Date();

      await payment.save();
      await this.confirmBooking(
        payment.booking.toString(),
        PaymentMethod.MPESA,
        payment.mpesaReceiptNumber ?? checkoutRequestId,
        payment.mpesaReceiptNumber ?? checkoutRequestId,
      );
    } else {
      payment.status        = PaymentStatus.FAILED;
      payment.failureReason = stk.ResultDesc;
      await payment.save();
      await this.handlePaymentFailed(payment.booking.toString());
    }
  }

  // ── Confirm booking + send receipt email ───────────────────────
  private async confirmBooking(
    bookingId: string,
    method: PaymentMethod,
    paymentReference: string,
    transactionId: string,
  ): Promise<void> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate<{ property: PropertyDocument }>('property');

    if (!booking) return;

    booking.status           = BookingStatus.CONFIRMED;
    booking.paymentReference = paymentReference;
    booking.transactionId    = transactionId;
    booking.paidAt           = new Date();
    await booking.save();

    const property = booking.property as PropertyDocument;

    await this.mailService.sendBookingConfirmedReceipt({
      guestName:       booking.guestName,
      guestEmail:      booking.guestEmail,
      propertyName:    property.name,
      propertyAddress: `${property.location.address}, ${property.location.city}`,
      checkIn:         booking.checkIn,
      checkOut:        booking.checkOut,
      guests:          booking.guests,
      totalPrice:      booking.totalPrice,
      currency:        'KES',
      bookingId:       booking._id.toString(),
      transactionId,
      paymentMethod:   method,
      paidAt:          booking.paidAt,
    });

    this.logger.log(`Booking ${bookingId} confirmed via ${method}`);
  }

  // Handle failed payment
  private async handlePaymentFailed(bookingId: string): Promise<void> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate<{ property: PropertyDocument }>('property');

    if (!booking) return;

    const property = booking.property as PropertyDocument;
    const appUrl   = process.env.APP_URL ?? '';

    await this.mailService.sendPaymentFailed({
      guestName:    booking.guestName,
      guestEmail:   booking.guestEmail,
      propertyName: property.name,
      bookingId:    booking._id.toString(),
      retryUrl:     `${appUrl}/bookings/${booking._id}/pay`,
    });
  }

  // Get booking payment status (for frontend polling)
  async getBookingPaymentStatus(bookingId: string) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .select('status');

    if (!booking) throw new NotFoundException('Booking not found');

    return { status: booking.status };
  }

  // Admin: get all payments 
  async findAll() {
    return this.paymentModel
      .find()
      .populate('booking guest')
      .sort({ createdAt: -1 });
  }

  // Guest: payments for a specific booking 
  async findByBooking(bookingId: string) {
    return this.paymentModel
      .find({ booking: new Types.ObjectId(bookingId) })
      .sort({ createdAt: -1 });
  }
}