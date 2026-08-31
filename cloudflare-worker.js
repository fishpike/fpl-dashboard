// FPL API CORS proxy — deploy this as a Cloudflare Worker.
// It forwards any request path to https://fantasy.premierleague.com and
// adds CORS headers, so the dashboard (a static GitHub Pages site) can
// call the FPL API directly from the browser without relying on
// unreliable third-party public CORS proxies.
//
// Example: a request to  https://<your-worker>.workers.dev/api/bootstrap-static/
// is forwarded to        https://fantasy.premierleague.com/api/bootstrap-static/

const FPL_ORIGIN = 'https://fantasy.premierleague.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = FPL_ORIGIN + url.pathname + url.search;

    let response;
    try {
      response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed: ' + err.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  },
};
