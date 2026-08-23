import { createClient } from 'npm:@supabase/supabase-js@2';
import { assistantKnowledge } from './knowledge.ts';

const allowedOrigins = new Set([
  'https://mfs1106.github.io',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
]);

const requestWindows = new Map<string, number[]>();
const RATE_LIMIT_MAX_REQUESTS = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;

function corsHeaders(origin: string | null) {
  const safeOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://mfs1106.github.io';
  return {
    'Access-Control-Allow-Origin': safeOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  };
}

function json(body: Record<string, string>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function isRateLimited(userId: string) {
  const now = Date.now();
  const requests = (requestWindows.get(userId) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (requests.length >= RATE_LIMIT_MAX_REQUESTS) return true;
  requests.push(now);
  requestWindows.set(userId, requests);
  return false;
}

function sanitizeHistory(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-6)
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string')
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 1200) }));
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: '不允许的来源' }, 403, origin);

  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  let supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!supabaseKey) {
    try {
      const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
      supabaseKey = keys.default;
    } catch {
      supabaseKey = undefined;
    }
  }
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!deepseekApiKey) return json({ error: 'AI 服务尚未配置，请联系管理员完成部署。' }, 503, origin);
  if (!supabaseUrl || !supabaseKey || !token) return json({ error: '请先登录后再使用 AI 助手。' }, 401, origin);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return json({ error: '登录状态已失效，请重新登录。' }, 401, origin);
  if (isRateLimited(user.id)) return json({ error: '提问过于频繁，请稍后一分钟再试。' }, 429, origin);

  let payload: { message?: unknown; history?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: '请求格式不正确。' }, 400, origin);
  }

  const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 1200) : '';
  if (!message) return json({ error: '请输入问题。' }, 400, origin);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      thinking: { type: 'disabled' },
      temperature: 0.2,
      max_tokens: 900,
      user_id: user.id.replace(/-/g, ''),
      messages: [
        { role: 'system', content: assistantKnowledge },
        ...sanitizeHistory(payload.history),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('DeepSeek request failed', response.status, detail.slice(0, 500));
    return json({ error: response.status === 429 ? 'AI 服务繁忙，请稍后重试。' : 'AI 服务暂时不可用，请稍后再试。' }, 502, origin);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) return json({ error: 'AI 服务未返回有效回答，请稍后重试。' }, 502, origin);

  return json({ answer }, 200, origin);
});

