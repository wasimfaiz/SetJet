import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Always connect to Mumbai (ap-south-1)
const ses = new SESClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface SendMailProps {
  to: string;
  subject: string;
  html: string ;
}

export async function sendEmail({ to, subject, html }: SendMailProps) {
  try {
    const command = new SendEmailCommand({
      Source: process.env.SES_SENDER_EMAIL!,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } },
      },
    });

    const result = await ses.send(command);
    console.log("✅ SES Email sent:", result.MessageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SES email:", error);
    return false;
  }
}
