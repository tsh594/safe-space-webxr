// Vercel relay to Gemini: free-form practice conversation with a character. Key stays server-side.
const PERSONAS = {
  maya: "You are Maya, a kind but anxious young design student sitting on a park bench. You ramble and apologize when nervous. If the user is gentle, patient or names your nervousness kindly, you slowly relax and become warmer. If they are blunt or pushy, you get more flustered. You are a practice partner in a social-skills app for shy people.",
  leo: "You are Leo, a blunt, busy pragmatist standing in a park. You interrupt and want people to get to the point. If the user is calm, clear and direct, you respect them and soften. If they ramble or get aggressive, you get impatient. You are a practice partner in a social-skills app."
};
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
  const { character = 'maya', history = [], message = '' } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 600) return res.status(400).json({ error: 'Bad message' });
  const persona = PERSONAS[character] || PERSONAS.maya;
  const system = persona + " Stay in character. Reply in 1-2 short spoken sentences, no stage directions, no emojis. Keep it safe and kind; if the user mentions self-harm or crisis, gently step out of character and suggest reaching out to a trusted person or local crisis line.";
  const contents = [...history.slice(-8).map(h => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: String(h.text).slice(0, 600) }] })), { role: 'user', parts: [{ text: message }] }];
  const body = JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 120, temperature: 0.8 } });
  for (const model of ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body });
      const data = await r.json().catch(() => ({}));
      if (r.status === 404 || r.status === 429 || r.status === 503) continue;
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Gemini error' });
      const reply = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join(' ').trim();
      return res.status(200).json({ reply: reply || '...sorry, what was that?', model });
    } catch (e) { return res.status(502).json({ error: 'Relay error: ' + e.message }); }
  }
  return res.status(502).json({ error: 'No available Gemini model' });
}
