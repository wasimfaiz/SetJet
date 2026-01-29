// lib/notifications.js
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: process.env.AWS_REGION });

export async function sendEmailOrPush(reminder) {
  const { phoneNumber, message } = reminder;

  // Only send SMS for now
  if (phoneNumber) {
    const smsParams = {
      Message: message,
      PhoneNumber: phoneNumber,
    };

    try {
      await sns.send(new PublishCommand(smsParams));
      console.log(`📲 SMS sent to ${phoneNumber}`);
    } catch (err) {
      console.error(`❌ Failed to send SMS to ${phoneNumber}:`, err);
    }
  }
}
