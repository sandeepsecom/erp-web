import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query, isService } = await req.json();
  const prompt = isService
    ? `Find top 5 SAC codes under India GST for: "${query}". Return ONLY a JSON array: [{"code":"998311","description":"Service description","rate":"18%"}]. No other text.`
    : `Find top 5 HSN codes under India GST for: "${query}". Return ONLY a JSON array: [{"code":"85258090","description":"Product description","rate":"18%"}]. No other text.`;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await response.json();
  const text = (data.content && data.content[0] && data.content[0].text) || '[]';
  try { return NextResponse.json({ results: JSON.parse(text.replace(/```json|```/g, '').trim()) }); }
  catch { return NextResponse.json({ results: [] }); }
}
