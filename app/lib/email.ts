// app/lib/email.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

export async function sendInvitationEmail(
  toEmail: string,
  inviteCode: string,
  senderName: string
) {
  const registerLink = `${process.env.NEXT_PUBLIC_APP_URL}`;
  
  // Format date for email clarity
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric', 
    year: 'numeric'
  });

  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "You've been invited to join ICC Project Management",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">              
              <p>Hello,</p>
              
              <p>${senderName} has invited you to join the ICC Project Management platform. This platform allows you to collaborate on construction projects, track tasks, and manage materials.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Your Registration Code:</p>
                <p style="font-size: 18px; background-color: #fff; padding: 10px; border-radius: 3px; border: 1px solid #ddd; margin-top: 8px;">${inviteCode}</p>
              </div>
              
              <p>To get started:</p>
              <ol>
                <li>Go to <a href="${registerLink}">${registerLink}</a></li>
                <li>Click Register</li>
                <li>Enter the registration code above when prompted</li>
              </ol>
              
              <p>This invitation was sent on ${formattedDate} and your code will not expire.</p>
              
              <p>If you have any questions, please contact the person who invited you.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
              
              <p style="color: #777; font-size: 12px;">This is an automated message from ICC Project Management. Please do not reply to this email.</p>
            </div>
          `,
        },
      },
    },
  };

  try {
    await ses.send(new SendEmailCommand(params));
    return { success: true };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
}