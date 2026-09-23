// Proxies every request to Supabase through this same-origin Vercel serverless function.
// Runs on Vercel's servers, not the visitor's device/network - so it works even when
// supabase.co is blocked client-side (school/work wifi filters, Screen Time restrictions, etc).
// Nothing about the Supabase project itself (tables, RLS, keys) needs to change for this to work.

const SUPABASE_PROJECT_URL = 'https://fzhparobkjgysfbsamci.supabase.co';

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://placeholder');
    
    // Strip leading /api/sb prefix
    let cleanPath = url.pathname.replace(/^\/api\/sb\/?/, '');
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    // Safely combine URLs
    const targetUrl = new URL(cleanPath + url.search, SUPABASE_PROJECT_URL).toString();

    const headers = {};
    ['apikey', 'authorization', 'content-type', 'prefer'].forEach((h) => {
      if (req.headers[h]) headers[h] = req.headers[h];
    });

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const upstream = await fetch(targetUrl, { method: req.method, headers, body });
    const text = await upstream.text();

    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'proxy_error', message: e.message });
  }
};
