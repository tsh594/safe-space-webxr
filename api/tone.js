// Vercel serverless relay: keeps the Hume API key on the server (never shipped to the browser).
// Browser sends a short 16 kHz mono 16-bit WAV (base64); we forward it to Hume Expression Measurement
// and return only the top vocal expressions + voice attributes. Audio is not stored.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.HUME_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is missing HUME_API_KEY' });
  const audio = req.body && req.body.audio;
  if (typeof audio !== 'string' || audio.length < 1000 || audio.length > 3_000_000) {
    return res.status(400).json({ error: 'Send {audio: base64 WAV} up to ~10 seconds' });
  }
  try {
    const form = new FormData();
    form.append('file', new Blob([Buffer.from(audio, 'base64')], { type: 'audio/wav' }), 'speech.wav');
    form.append('config', new Blob([JSON.stringify({ measurement_timer_ms: 5000 })], { type: 'application/json' }));
    const r = await fetch('https://api.cloud.hume.ai/v1/expression/audio/file', {
      method: 'POST', headers: { 'X-Hume-Api-Key': key }, body: form
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: data.message || data.code || 'Hume request failed' });
    const sum = (field) => {
      const t = {};
      for (const m of data.measurements || []) for (const e of m[field] || []) t[e.name] = Math.max(t[e.name] || 0, e.probability);
      return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, p]) => ({ name, p: Math.round(p * 100) / 100 }));
    };
    return res.status(200).json({ expressions: sum('expressions'), voice: sum('voice_attributes'), utterances: (data.utterances || []).length });
  } catch (e) {
    return res.status(502).json({ error: 'Relay error: ' + e.message });
  }
}
