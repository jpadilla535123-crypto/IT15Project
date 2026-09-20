// EventSphere API -> Cloudflare Worker reverse proxy.
// Deployed at: https://eventsphere-api.<account>.workers.dev
//
// Why: MonsterASP's free plan has NO HTTPS. Browsers block HTTPS->HTTP
// ("mixed content"), so a Cloudflare Worker (auto-HTTPS, free tier) fronts
// the HTTP backend for the Vercel SPA and PayMongo webhooks.
//
// Paste this into the Worker (Workers & Pages -> eventsphere-api -> Edit
// code) replacing the default "Hello World" handler, then click Deploy.
// CORS: the Worker answers browsers' OPTIONS preflights itself and stamps
// Access-Control-Allow-Origin on every response, so the backend CORS list
// is not the deciding factor for browser traffic.

const UPSTREAM = "http://eventsphere-backend.runasp.net";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const target = UPSTREAM + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.delete("host");

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const upstreamResponse = await fetch(target, init);
    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};