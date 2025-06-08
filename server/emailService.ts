import nodemailer from 'nodemailer';
import { Campaign, Donation } from '@shared/schema';

interface DonationEmailData {
  recipientEmail: string;
  recipientName: string;
  donation: {
    amount: number;
    tip: number;
    total: number;
    transactionId: string;
    date: Date;
  };
  campaign: {
    title: string;
    description: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize with a basic transporter that can be configured later
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // For development, use Ethereal email (test email service)
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('Email service initialized with test account:', testAccount.user);
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      
      // Fallback to a simple configuration for development
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true,
      });
    }
  }

  async sendDonationConfirmation(data: DonationEmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      const mailOptions = {
        from: '"Christ Collective" <luis@christcollective.info>',
        to: data.recipientEmail,
        subject: 'Thank you for your donation to Christ Collective',
        html: this.generateDonationReceiptHTML(data),
        text: this.generateDonationReceiptText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Donation confirmation email sent:', info.messageId);
      
      // For development with Ethereal email, log the preview URL
      if (info.response?.includes('ethereal')) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send donation confirmation email:', error);
      return false;
    }
  }

  private generateDonationReceiptHTML(data: DonationEmailData): string {
    const { recipientName, donation, campaign } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Donation Receipt - Christ Collective</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #D4AF37; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #D4AF37; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .divider { border-top: 1px solid #eee; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Donation</h1>
            <p>Christ Collective</p>
          </div>
          
          <div class="content">
            <h2>Dear ${recipientName},</h2>
            <p>Thank you for your generous donation to support <strong>${campaign.title}</strong>. Your contribution makes a meaningful difference in advancing our mission of uniting Christians worldwide.</p>
            
            <div class="receipt-box">
              <h3>Donation Receipt</h3>
              <div class="divider"></div>
              
              <p><strong>Campaign:</strong> ${campaign.title}</p>
              <p><strong>Donation Amount:</strong> $${donation.amount.toFixed(2)}</p>
              ${donation.tip > 0 ? `<p><strong>Platform Tip:</strong> $${donation.tip.toFixed(2)}</p>` : ''}
              <div class="divider"></div>
              <p><strong>Total Amount:</strong> <span class="amount">$${donation.total.toFixed(2)}</span></p>
              <p><strong>Transaction ID:</strong> ${donation.transactionId}</p>
              <p><strong>Date:</strong> ${donation.date.toLocaleDateString()}</p>
            </div>
            
            <p>This email serves as your official donation receipt. Please keep this for your records.</p>
            
            <p>Your support helps us:</p>
            <ul>
              <li>Connect Christians across denominational boundaries</li>
              <li>Support business networking and growth</li>
              <li>Enable content creators to share their faith</li>
              <li>Fund community outreach and charitable initiatives</li>
            </ul>
            
            <p>If you have any questions about your donation, please contact us at luis@christcollective.info.</p>
            
            <p>Blessings,<br>The Christ Collective Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Christ Collective. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateDonationReceiptText(data: DonationEmailData): string {
    const { recipientName, donation, campaign } = data;
    
    return `
Thank You for Your Donation - Christ Collective

Dear ${recipientName},

Thank you for your generous donation to support ${campaign.title}. Your contribution makes a meaningful difference in advancing our mission of uniting Christians worldwide.

DONATION RECEIPT
================

Campaign: ${campaign.title}
Donation Amount: $${donation.amount.toFixed(2)}
${donation.tip > 0 ? `Platform Tip: $${donation.tip.toFixed(2)}\n` : ''}Total Amount: $${donation.total.toFixed(2)}
Transaction ID: ${donation.transactionId}
Date: ${donation.date.toLocaleDateString()}

This email serves as your official donation receipt. Please keep this for your records.

Your support helps us:
- Connect Christians across denominational boundaries
- Support business networking and growth
- Enable content creators to share their faith
- Fund community outreach and charitable initiatives

If you have any questions about your donation, please contact us at luis@christcollective.info.

Blessings,
The Christ Collective Team

--
© ${new Date().getFullYear()} Christ Collective. All rights reserved.
This is an automated message. Please do not reply to this email.
    `;
  }
}

export const emailService = new EmailService();