// Tone Coach: record a few seconds of speech, encode 16 kHz mono 16-bit WAV, ask our relay (Hume) how it sounded.
let micStream = null;
export async function ensureMic() {
  if (micStream) return micStream;
  micStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  return micStream;
}
export async function recordWav(seconds = 4) {
  const stream = await ensureMic();
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  proc.onaudioprocess = e => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  src.connect(proc); proc.connect(ctx.destination);
  await new Promise(r => setTimeout(r, seconds * 1000));
  proc.disconnect(); src.disconnect();
  const rate = ctx.sampleRate; await ctx.close();
  const len = chunks.reduce((n, c) => n + c.length, 0);
  const all = new Float32Array(len); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  // downsample to 16 kHz (box filter)
  const ratio = rate / 16000; const outLen = Math.floor(len / ratio); const pcm = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const a = Math.floor(i * ratio), b = Math.min(len, Math.floor((i + 1) * ratio)); let s = 0;
    for (let j = a; j < b; j++) s += all[j];
    const v = Math.max(-1, Math.min(1, s / Math.max(1, b - a))); pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.length * 2); const dv = new DataView(buf);
  const w = (p, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(p + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 16000, true);
  dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  let bin = ''; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export async function measureTone(seconds = 4) {
  const audio = await recordWav(seconds);
  const r = await fetch('/api/tone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Tone service unavailable (${r.status})`);
  return data;
}
