import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    const sandbox = this.config.get<string>('MPESA_ENV') !== 'production';
    this.baseUrl = sandbox
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  // ── Get OAuth token ────────────────────────────────────────────
  async getAccessToken(): Promise<string> {
    const consumerKey    = this.config.getOrThrow<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.config.getOrThrow<string>('MPESA_CONSUMER_SECRET');
    const credentials    = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const { data } = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    return data.access_token as string;
  }

  // ── Initiate STK Push ──────────────────────────────────────────
  async initiateSTKPush(params: {
    phone: string;
    amount: number;
    bookingId: string;
    accountReference: string;
    description: string;
  }): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
    const token       = await this.getAccessToken();
    const shortCode   = this.config.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey     = this.config.getOrThrow<string>('MPESA_PASSKEY');
    const callbackUrl = this.config.getOrThrow<string>('MPESA_CALLBACK_URL');

    const timestamp = this.getTimestamp();
    const password  = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    // Normalise phone: strip leading 0 or + and ensure 254 prefix
    const phone = this.normalizePhone(params.phone);

    const body = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(params.amount),   // M-Pesa only accepts integers
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: params.accountReference.substring(0, 12), // max 12 chars
      TransactionDesc: params.description.substring(0, 13),       // max 13 chars
    };

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        body,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data.ResponseCode !== '0') {
        throw new BadRequestException(data.ResponseDescription ?? 'M-Pesa STK push failed');
      }

      return {
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      };
    } catch (err: any) {
      const message = err?.response?.data?.errorMessage ?? err?.message ?? 'M-Pesa error';
      this.logger.error(`STK Push failed: ${message}`);
      throw new BadRequestException(`M-Pesa: ${message}`);
    }
  }

  // ── Query STK Push status (optional polling fallback) ──────────
  async querySTKStatus(checkoutRequestId: string): Promise<any> {
    const token     = await this.getAccessToken();
    const shortCode = this.config.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey   = this.config.getOrThrow<string>('MPESA_PASSKEY');
    const timestamp = this.getTimestamp();
    const password  = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const { data } = await axios.post(
      `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
      { BusinessShortCode: shortCode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return data;
  }

  // ── Helpers ────────────────────────────────────────────────────
  private getTimestamp(): string {
    return new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .substring(0, 14);
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0'))   return `254${cleaned.substring(1)}`;
    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('+'))   return cleaned.substring(1);
    return `254${cleaned}`;
  }
}