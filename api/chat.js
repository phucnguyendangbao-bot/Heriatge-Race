// Vercel Serverless Function: POST /api/chat
// Proxies user messages to Anthropic Claude API using a server-side key.
// The API key is read from environment variable ANTHROPIC_API_KEY (set on Vercel dashboard).
//
// Client never sees the key. Includes basic rate limiting + input validation
// to reduce abuse risk.

// In-memory rate limit. NOTE: Vercel cold starts reset this; for stronger limits,
// upgrade to Vercel KV / Upstash Redis. This is a reasonable v1 protection.
const rateBucket = new Map();
const RATE_LIMIT = 15;          // requests
const RATE_WINDOW_MS = 60_000;  // per minute, per IP

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateBucket.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_WINDOW_MS;
  }
  entry.count++;
  rateBucket.set(ip, entry);
  // Periodic cleanup
  if (rateBucket.size > 5000) {
    for (const [k, v] of rateBucket) if (v.reset < now) rateBucket.delete(k);
  }
  return {
    allowed: entry.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    resetAt: entry.reset
  };
}

// System prompt for the AI
const SYSTEM_PROMPT = `Bạn là trợ lý AI cho game "Cờ Tỉ Phú Di Sản Việt Nam" — phiên bản Monopoly với 22 di sản Việt Nam (Hạ Long, Hội An, Huế, Phú Quốc, Sa Pa, Phong Nha, Tràng An, v.v.).

Nguyên tắc trả lời:
- Tiếng Việt, ngắn gọn (tối đa 3-4 câu hoặc bullet ngắn).
- Thân thiện, dùng emoji phù hợp văn hoá Việt.
- Khi tư vấn chiến thuật: dùng dữ liệu game state thật được cung cấp.
- Không bịa số liệu. Không thực hiện hành động trong game (chỉ tư vấn).
- Nếu user hỏi ngoài chủ đề (chính trị, code, etc.) → lịch sự kéo về chủ đề game.

Luật cơ bản: Mỗi người chơi bắt đầu 15tr vàng, đổ xúc xắc di chuyển, dừng ở ô đất chưa có chủ thì mua, có chủ thì đóng tiền thuê. Sưu tập đủ 1 vùng miền (Bắc/Trung/Nam) thì được xây khách sạn.`;

export default async function handler(req, res) {
  // Method check
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Rate limit by IP
  const ip = getIP(req);
  const rl = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
  if (!rl.allowed) {
    return res.status(429).json({
      error: 'rate_limited',
      message: 'Bạn hỏi nhanh quá. Đợi 1 phút rồi thử lại nhé.'
    });
  }

  // Parse body (Vercel auto-parses JSON)
  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const context = typeof body.context === 'string' ? body.context.slice(0, 800) : '';

  if (!message) {
    return res.status(400).json({ error: 'bad_request', message: 'Thiếu trường "message"' });
  }
  if (message.length > 500) {
    return res.status(400).json({
      error: 'message_too_long',
      message: 'Câu hỏi tối đa 500 ký tự để tiết kiệm chi phí.'
    });
  }

  // Read key from env (set on Vercel dashboard)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY env var not set');
    return res.status(500).json({
      error: 'api_not_configured',
      message: 'AI tạm chưa khả dụng. Liên hệ admin.'
    });
  }

  // Call Anthropic
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: `${SYSTEM_PROMPT}\n\nGame state hiện tại của người chơi:\n${context || '(chưa có)'}`,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('Anthropic API error', r.status, errText.slice(0, 200));
      return res.status(502).json({
        error: 'upstream_error',
        message: 'AI tạm thời không trả lời được. Thử lại sau.'
      });
    }

    const data = await r.json();
    const text = data?.content?.[0]?.text || '(không có nội dung)';
    const usage = data?.usage || null;

    return res.status(200).json({ text, usage });
  } catch (e) {
    console.error('Handler error', e);
    return res.status(500).json({
      error: 'server_error',
      message: 'Có lỗi xảy ra. Thử lại sau.'
    });
  }
}
