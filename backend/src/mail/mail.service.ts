import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface BookingReceiptData {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  propertyAddress: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  currency: string;
  bookingId: string;
  transactionId: string;
  paymentMethod: string;
  paidAt: Date;
}

export interface BookingAwaitingPaymentData {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  currency: string;
  bookingId: string;
  paymentDeadlineMinutes: number;
}

export interface PaymentFailedData {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  bookingId: string;
  retryUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT') ?? 587,
      secure: false,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  // ── 1. Booking received — awaiting payment ─────────────────────
  async sendBookingAwaitingPayment(data: BookingAwaitingPaymentData): Promise<void> {
    const subject = `Booking Received — Complete Payment to Confirm`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#173350;padding:32px 24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Booking Received!</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Complete payment to secure your stay</p>
        </div>

        <div style="background:#f9f9f9;padding:32px 24px;">
          <p style="font-size:16px;">Hi <strong>${data.guestName}</strong>,</p>
          <p style="font-size:15px;line-height:1.6;">
            We've received your booking request for <strong>${data.propertyName}</strong>.
            To confirm your reservation, please complete your payment within
            <strong>${data.paymentDeadlineMinutes} minutes</strong>.
          </p>

          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
            <h3 style="margin:0 0 16px;color:#173350;">Booking Summary</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#6b7280;">Property</td><td style="padding:6px 0;font-weight:600;">${data.propertyName}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Check-in</td><td style="padding:6px 0;">${this.formatDate(data.checkIn)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Check-out</td><td style="padding:6px 0;">${this.formatDate(data.checkOut)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Total Amount</td><td style="padding:6px 0;font-weight:700;color:#173350;">${data.currency} ${data.totalPrice.toLocaleString()}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Booking ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${data.bookingId}</td></tr>
            </table>
          </div>

          <p style="font-size:13px;color:#6b7280;">
            If payment is not completed within ${data.paymentDeadlineMinutes} minutes,
            your booking will be automatically cancelled and the dates will be released.
          </p>
        </div>

        <div style="background:#173350;padding:16px 24px;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">
            © ${new Date().getFullYear()} — If you did not make this booking, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await this.send(data.guestEmail, subject, html);
  }

  // ── 2. Payment confirmed — full receipt ────────────────────────
  async sendBookingConfirmedReceipt(data: BookingReceiptData): Promise<void> {
    const nights = Math.ceil(
      (data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    const subject = `Booking Confirmed ✓ — Your Receipt for ${data.propertyName}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#173350;padding:32px 24px;border-radius:8px 8px 0 0;text-align:center;">
          <div style="width:56px;height:56px;background:#22c55e;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:28px;">✓</span>
          </div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Booking Confirmed!</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Thank you — we can't wait to have you!</p>
        </div>

        <div style="background:#f9f9f9;padding:32px 24px;">
          <p style="font-size:16px;">Hi <strong>${data.guestName}</strong>,</p>
          <p style="font-size:15px;line-height:1.6;">
            Your payment has been received and your booking at
            <strong>${data.propertyName}</strong> is now <strong>confirmed</strong>.
            We're excited to host you — see your full receipt below.
          </p>

          <!-- Receipt -->
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
            <h3 style="margin:0 0 4px;color:#173350;">Official Receipt</h3>
            <p style="margin:0 0 20px;font-size:12px;color:#9ca3af;">Booking ID: ${data.bookingId}</p>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Property</td>
                <td style="padding:10px 0;font-weight:600;">${data.propertyName}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Address</td>
                <td style="padding:10px 0;">${data.propertyAddress}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Check-in</td>
                <td style="padding:10px 0;">${this.formatDate(data.checkIn)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Check-out</td>
                <td style="padding:10px 0;">${this.formatDate(data.checkOut)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Duration</td>
                <td style="padding:10px 0;">${nights} night${nights > 1 ? 's' : ''}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Guests</td>
                <td style="padding:10px 0;">${data.guests}</td>
              </tr>
              <tr style="border-bottom:2px solid #173350;">
                <td style="padding:10px 0;color:#6b7280;">Payment Method</td>
                <td style="padding:10px 0;">${data.paymentMethod.toUpperCase()}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Transaction ID</td>
                <td style="padding:10px 0;font-family:monospace;font-size:12px;">${data.transactionId}</td>
              </tr>
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 0;color:#6b7280;">Paid At</td>
                <td style="padding:10px 0;">${this.formatDate(data.paidAt)}</td>
              </tr>
              <tr>
                <td style="padding:14px 0 0;font-weight:700;font-size:16px;color:#173350;">Total Paid</td>
                <td style="padding:14px 0 0;font-weight:700;font-size:18px;color:#173350;">${data.currency} ${data.totalPrice.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <p style="font-size:14px;color:#374151;line-height:1.6;">
            If you have any questions before your stay, feel free to reach out.
            We look forward to welcoming you!
          </p>
        </div>

        <div style="background:#173350;padding:16px 24px;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">
            © ${new Date().getFullYear()} — Please keep this email as your booking receipt.
          </p>
        </div>
      </div>
    `;

    await this.send(data.guestEmail, subject, html);
  }

  // ── 3. Payment failed ──────────────────────────────────────────
  async sendPaymentFailed(data: PaymentFailedData): Promise<void> {
    const subject = `Payment Failed — Retry to Confirm Your Booking`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#dc2626;padding:32px 24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Payment Failed</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Your booking has not been confirmed yet</p>
        </div>

        <div style="background:#f9f9f9;padding:32px 24px;">
          <p style="font-size:16px;">Hi <strong>${data.guestName}</strong>,</p>
          <p style="font-size:15px;line-height:1.6;">
            Unfortunately your payment for <strong>${data.propertyName}</strong>
            could not be processed. Your booking is still pending — please retry
            before the payment window closes.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${data.retryUrl}"
               style="background:#173350;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
              Retry Payment
            </a>
          </div>

          <p style="font-size:13px;color:#6b7280;">Booking ID: ${data.bookingId}</p>
        </div>

        <div style="background:#173350;padding:16px 24px;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">
            © ${new Date().getFullYear()} — If you did not make this booking, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await this.send(data.guestEmail, subject, html);
  }

  // ── Internal send helper ───────────────────────────────────────
  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.config.get('MAIL_FROM_NAME') ?? 'Airbnb'}" <${this.config.get('MAIL_USER')}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}