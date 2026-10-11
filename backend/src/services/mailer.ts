import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface SentEmailRecord {
  to: string;
  subject: string;
  text: string;
  html: string;
  token?: string;
  sentAt: Date;
  messageId?: string;
}

export class MailerService {
  private transporter: Transporter | null = null;
  private sentEmails: SentEmailRecord[] = [];

  constructor() {
    this.initTransporter();
  }

  private async initTransporter(): Promise<void> {
    try {
      // In development or test, we use a JSON stream or test transporter
      if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'windows',
          buffer: true,
        });
      } else {
        // Production SMTP or configured service
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        });
      }
    } catch (err) {
      console.error('[MailerService] Transporter initialization failed:', err);
    }
  }

  public async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    const subject = 'Verify your HacXLerate — Kampus.VC Account';
    const text = `Welcome to HacXLerate! Please verify your email by clicking: ${verifyUrl} (Token: ${token})`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
        <h2 style="color: #a855f7;">Welcome to HacXLerate — Kampus.VC</h2>
        <p>Thank you for registering. Please click below to verify your account email address:</p>
        <p><a href="${verifyUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
        <p style="color: #94a3b8; font-size: 12px;">Or use this verification code: <code>${token}</code></p>
      </div>
    `;

    try {
      if (!this.transporter) {
        await this.initTransporter();
      }

      const info = await this.transporter!.sendMail({
        from: '"HacXLerate Security" <security@hacxlerate.kampus.vc>',
        to,
        subject,
        text,
        html,
      });

      const record: SentEmailRecord = {
        to,
        subject,
        text,
        html,
        token,
        sentAt: new Date(),
        messageId: info.messageId,
      };

      this.sentEmails.push(record);
      console.log(`[MailerService] Verification email dispatched to ${to} (Token: ${token.substring(0, 8)}...)`);
      return true;
    } catch (err) {
      console.error('[MailerService] Failed sending verification email:', err);
      return false;
    }
  }

  public async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    const subject = 'Reset your HacXLerate password';
    const text = `You requested a password reset. Please use the following link to reset your password: ${resetUrl} (Token: ${token}). This link expires in 1 hour.`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
        <h2 style="color: #38bdf8;">Password Reset Request</h2>
        <p>We received a request to reset your HacXLerate password. Click below within 1 hour to proceed:</p>
        <p><a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p style="color: #94a3b8; font-size: 12px;">Reset code: <code>${token}</code></p>
        <p style="color: #f43f5e; font-size: 11px;">If you did not request this, please disregard this email.</p>
      </div>
    `;

    try {
      if (!this.transporter) {
        await this.initTransporter();
      }

      const info = await this.transporter!.sendMail({
        from: '"HacXLerate Security" <security@hacxlerate.kampus.vc>',
        to,
        subject,
        text,
        html,
      });

      const record: SentEmailRecord = {
        to,
        subject,
        text,
        html,
        token,
        sentAt: new Date(),
        messageId: info.messageId,
      };

      this.sentEmails.push(record);
      console.log(`[MailerService] Password reset email dispatched to ${to}`);
      return true;
    } catch (err) {
      console.error('[MailerService] Failed sending password reset email:', err);
      return false;
    }
  }

  public async sendNotificationEmail(
    to: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<boolean> {
    const subject = `[HacXLerate] ${title}`;
    const text = `${title}\n\n${message}\n\n${actionUrl ? `View in Dashboard: ${actionUrl}` : ''}`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
        <h2 style="color: #a855f7;">${title}</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">${message}</p>
        ${actionUrl ? `<p><a href="${actionUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Dashboard</a></p>` : ''}
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">HacXLerate — Kampus.VC Notification System</p>
      </div>
    `;

    try {
      if (!this.transporter) {
        await this.initTransporter();
      }

      const info = await this.transporter!.sendMail({
        from: '"HacXLerate Notifications" <notifications@hacxlerate.kampus.vc>',
        to,
        subject,
        text,
        html,
      });

      this.sentEmails.push({
        to,
        subject,
        text,
        html,
        sentAt: new Date(),
        messageId: info.messageId,
      });

      console.log(`[MailerService] Notification email dispatched to ${to}`);
      return true;
    } catch (err) {
      console.error('[MailerService] Failed sending notification email:', err);
      return false;
    }
  }

  public getLastSentEmail(to?: string): SentEmailRecord | undefined {
    if (to) {
      for (let i = this.sentEmails.length - 1; i >= 0; i--) {
        if (this.sentEmails[i].to.toLowerCase() === to.toLowerCase()) {
          return this.sentEmails[i];
        }
      }
      return undefined;
    }
    return this.sentEmails[this.sentEmails.length - 1];
  }

  public clearSentEmails(): void {
    this.sentEmails = [];
  }
}

export const mailerService = new MailerService();
