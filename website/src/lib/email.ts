export async function sendEmail(
  email: string,
  subject: string,
  html: string,
  RESEND_API_KEY: string,
  EMAIL_FROM: string,
) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: subject,
      html: html,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return Response.json(data);
  }
}
