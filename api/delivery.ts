const N8N_URL = (process?.env?.N8N_WEBHOOK_URL as string) || 'https://n8n.dmytrotovstytskyi.online/webhook/delivery';

const ALLOWED_ORIGINS = ((process?.env?.CORS_ALLOWED_ORIGINS as string) || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const isAllowed = !ALLOWED_ORIGINS.length || ALLOWED_ORIGINS.includes(origin);
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyString,
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (error: any) {
    res.status(502).json({ error: 'Bad gateway to n8n', detail: error?.message });
  }
}
