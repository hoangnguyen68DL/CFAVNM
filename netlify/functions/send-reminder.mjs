const json = (statusCode, body) => Response.json(body, { status: statusCode });

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) return json(500, { error: 'RESEND_API_KEY chưa được cấu hình trên Netlify.' });

  let payload;
  try { payload = await request.json(); } catch { return json(400, { error: 'Dữ liệu gửi lên không hợp lệ.' }); }
  const to = typeof payload?.to === 'string' ? payload.to.trim() : '';
  const subject = typeof payload?.subject === 'string' ? payload.subject.trim() : '';
  const html = typeof payload?.html === 'string' ? payload.html : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject || !html) {
    return json(400, { error: 'Cần có email nhận, tiêu đề và nội dung email.' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'CharterPrep <onboarding@resend.dev>',
      to: [to], subject, html
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json(response.status, { error: result?.message || 'Resend chưa gửi được email.' });
  return json(200, { ok: true, id: result.id });
};
