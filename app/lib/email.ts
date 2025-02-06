import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { sign } from 'jsonwebtoken';

const ses = new SESClient({
  region: process.env.AMPLIFY_REGION,
  credentials: {
    accessKeyId: process.env.AMPLIFY_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMPLIFY_SECRET_ACCESS_KEY!,
  },
});

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Password Reset Request",
      },
      Body: {
        Html: {
          Data: `
            <h1>Password Reset Request</h1>
            <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>If you didn't request this reset, please ignore this email.</p>
          `,
        },
      },
    },
  };

  try {
    await ses.send(new SendEmailCommand(params));
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendNotificationEmail(
  toEmail: string,
  subject: string,
  content: string
) {
  const unsubscribeToken = sign(
    { email: toEmail, purpose: 'unsubscribe' },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}&token=${unsubscribeToken}`;

  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: `
            ${content}
            <br/>
            <br/>
            <p style="font-size: 12px; color: #666;">
              To unsubscribe from these notifications, 
              <a href="${unsubscribeLink}">click here</a>
            </p>
          `,
        },
      },
    },
  };

  try {
    await ses.send(new SendEmailCommand(params));
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}