export function welcomeEmail(name: string) {
  return `
  <div style="font-family: Arial; padding: 20px; background:#f6f8fa;">
    <h2>Welcome, ${name}! 🎉</h2>
    <p>Thank you for joining us. Your account has been successfully created.</p>
    <p>We’re excited to have you onboard!</p>

    <br/>
    <p>Regards,<br/>Team Yastudy</p>
  </div>
  `;
}
