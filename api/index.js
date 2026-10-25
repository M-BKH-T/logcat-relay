export default async function handler(req, res) {
  // تنظیم هدرهای CORS برای پذیرش درخواست از کلاینت‌ها
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).send('Logcat Relay is active.');
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const workerResponse = await fetch('https://logcat-receiver.mahdibadrkhani80.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: rawBody
    });

    const data = await workerResponse.text();
    return res.status(workerResponse.status).send(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}