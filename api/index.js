export default async function handler(req, res) {
  // ۱. تنظیم هدرهای کامل CORS برای ارتباط ایمن
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const WORKER_BASE = 'https://logcat-receiver.mahdibadrkhani80.workers.dev';

  try {
    const rawUrl = req.url || '';
    const parsedUrl = new URL(rawUrl, 'http://localhost');
    const pathname = parsedUrl.pathname.toLowerCase();
    const search = parsedUrl.search || '';

    let targetPath = '/';

    // ۲. مسیریابی دقیق بر اساس توابع ورکر
    if (pathname.includes('redeem')) {
      targetPath = '/api/redeem';
    } else if (pathname.includes('create-reward-code')) {
      targetPath = '/api/create-reward-code';
    } else if (pathname.includes('delete-reward-code')) {
      targetPath = '/api/delete-reward-code';
    } else if (pathname.includes('reward-codes')) {
      targetPath = '/api/reward-codes';
    } else if (pathname.includes('stats')) {
      targetPath = '/api/stats';
    } else if (pathname.includes('export-and-purge')) {
      targetPath = '/api/export-and-purge';
    } else if (pathname.includes('delete-selected')) {
      targetPath = '/api/delete-selected';
    } else {
      // اگر لاگ عادی است یا صفحه داشبورد وب
      targetPath = '/';
    }

    const targetUrl = `${WORKER_BASE}${targetPath}${search}`;

    // ۳. کپی هدرها و حذف هدرهای مشکل‌ساز در پراکسی
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'content-length' && lowerKey !== 'connection') {
        headers[lowerKey] = value;
      }
    }
    headers['content-type'] = req.headers['content-type'] || 'application/json';

    const fetchOptions = {
      method: req.method,
      headers: headers
    };

    // ۴. ارسال صحیح بادی در متدهای POST و PUT
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const workerResponse = await fetch(targetUrl, fetchOptions);
    const responseData = await workerResponse.text();

    res.status(workerResponse.status);

    const contentType = workerResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    return res.send(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
