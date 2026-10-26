export default async function handler(req, res) {
  // ۱. هدرهای کامل CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const WORKER_BASE = 'https://logcat-receiver.mahdibadrkhani80.workers.dev';

  try {
    // ۲. خواندن مطمئن بادی درخواست (چه استریم باشد چه آبجکت پارس‌شده)
    let rawBody = '';
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        rawBody = await new Promise((resolve) => {
          let data = '';
          req.on('data', (chunk) => { data += chunk; });
          req.on('end', () => resolve(data));
          req.on('error', () => resolve(''));
        });
      }
    }

    let parsedBody = {};
    try {
      if (rawBody) parsedBody = JSON.parse(rawBody);
    } catch (_) {}

    // ۳. شناسایی هوشمند مسیر مقصد:
    // حتی اگر مسیر /api/api/redeem باشد، یا ورسل مسیر را مخفی کرده باشد، وجود فیلد code نشان‌دهنده ریدیم است!
    const fullUrl = (req.url || '').toLowerCase();
    let targetPath = '/';

    if (parsedBody && parsedBody.code) {
      targetPath = '/api/redeem';
    } else if (fullUrl.includes('redeem')) {
      targetPath = '/api/redeem';
    } else if (fullUrl.includes('create-reward-code')) {
      targetPath = '/api/create-reward-code';
    } else if (fullUrl.includes('delete-reward-code')) {
      targetPath = '/api/delete-reward-code';
    } else if (fullUrl.includes('reward-codes')) {
      targetPath = '/api/reward-codes';
    } else if (fullUrl.includes('stats')) {
      targetPath = '/api/stats';
    } else if (fullUrl.includes('delete-selected')) {
      targetPath = '/api/delete-selected';
    } else if (fullUrl.includes('export-and-purge')) {
      targetPath = '/api/export-and-purge';
    } else {
      targetPath = '/';
    }

    const targetUrl = `${WORKER_BASE}${targetPath}`;

    // ۴. ارسال به ورکر کلادفلر
    const fetchHeaders = {
      'Content-Type': 'application/json'
    };
    if (req.headers['authorization']) {
      fetchHeaders['Authorization'] = req.headers['authorization'];
    }

    const fetchOptions = {
      method: req.method,
      headers: fetchHeaders
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && rawBody) {
      fetchOptions.body = rawBody;
    }

    const workerResponse = await fetch(targetUrl, fetchOptions);
    const responseData = await workerResponse.text();

    // ۵. ترفند طلایی برای اندروید:
    // کد وضعیت همیشه ۲۰۰ بازگردانده می‌شود تا HttpURLConnection اندروید کرش نکند و متن پیام خطا را در توست نشان دهد
    res.status(200);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(responseData);

  } catch (error) {
    // در صورت بروز خطای داخلی در ورسل، پاسخ جیسون با وضعیت ۲۰۰ برمی‌گردد تا در توست گوشی نمایش داده شود
    res.status(200);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({
      status: 'ERROR',
      message_fa: 'خطای واسط ورسل: ' + error.message
    });
  }
}
