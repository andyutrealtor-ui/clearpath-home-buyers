import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, res) {
  let body = req.body;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }
  }

  if (!body || !body.to || !body.message) {
    return res.status(400).json({ success: false, error: 'Missing "to" or "message" in request body' });
  }

  const { to, message } = body;

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    res.status(200).json({ success: true, sid: result.sid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}