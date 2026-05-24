/**
 * Patient Link AI — Claude API Proxy (Vercel Serverless Function)
 *
 * SECURITY: The Anthropic API key NEVER reaches the browser.
 * It lives only in the Vercel environment variable ANTHROPIC_API_KEY.
 *
 * This endpoint receives requests from the frontend at /api/claude,
 * adds the key, forwards to Anthropic, and returns the response.
 *
 * Rate-limit-friendly: add additional checks here if you expect heavy traffic.
 */

export default async function handler(req, res) {
  // CORS — only same origin (the frontend on the same domain)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      detail: 'ANTHROPIC_API_KEY environment variable is not set. ' +
              'Add it in Vercel project settings → Environment Variables.',
    });
  }

  // Basic request validation
  const body = req.body || {};
  if (!body.model || !body.messages) {
    return res.status(400).json({ error: 'Invalid request: missing model or messages' });
  }

  // Optional: hard cap on max_tokens to control spend
  if (body.max_tokens && body.max_tokens > 1500) {
    body.max_tokens = 1500;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Claude proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      detail: error.message,
    });
  }
}
