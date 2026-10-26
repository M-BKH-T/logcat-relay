export default async function handler(req, res) {
  // تنظیم هدرهای کامل CORS برای ارتباط امن پنل وب و اپلیکیشن
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const WORKER_BASE = 'https://logcat-receiver.mahdibadrkhani80.workers.dev';

  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const search = parsedUrl.search || '';

    // تمیز کردن مسیر ورودی
    const cleanPath = pathname.replace(/^\/+/, '');

    let targetPath = '';

    // تطبیق هوشمند مسیرها بدون وابستگی به نحوه ارسال برنامه منتشرشده
    if (cleanPath.includes('redeem')) {
      targetPath = '/api/redeem';
    } else if (cleanPath.includes('create-reward-code')) {
      targetPath = '/api/create-reward-code';
    } else if (cleanPath.includes('delete-reward-code')) {
      targetPath = '/api/delete-reward-code';
    } else if (cleanPath.includes('reward-codes')) {
      targetPath = '/api/reward-codes';
    } else if (cleanPath.includes('stats')) {
      targetPath = '/api/stats';
    } else if (cleanPath === 'api' || cleanPath === '' || cleanPath === 'api/') {
      // لاگ‌های تله‌متری و خطاهای عادی که ورکر در روت دریافت می‌کند
      targetPath = '/';
    } else {
      targetPath = '/' + cleanPath.replace(/^api\/api\//, 'api/');
    }

    const targetUrl = `${WORKER_BASE}${targetPath}${search}`;

    const fetchHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json'
    };

    if (req.headers['authorization']) {
      fetchHeaders['Authorization'] = req.headers['authorization'];
    }

    const fetchOptions = {
      method: req.method,
      headers: fetchHeaders
    };

    // پاس دادن بادی برای متدهای غیر GET
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
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
