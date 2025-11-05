// Simple proxy server to forward chat requests to an Ollama HTTP endpoint.
// Usage:
// 1) Install dependencies: npm install express node-fetch cors
// 2) Set env OLLAMA_URL to your Ollama API endpoint (e.g. http://localhost:11434/api/generate or similar)
// 3) Run: node index.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
// Default proxy port: if you run Ollama on 3001, set this to a different port (e.g. 3002)
const port = process.env.PORT || 3002;
// Default Ollama HTTP endpoint used when OLLAMA_URL env var is not set
const DEFAULT_OLLAMA = 'http://localhost:11434/api/generate';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/ollama-chat', async (req, res) => {
  const { message, history, model } = req.body || {};
  const OLLAMA_URL = process.env.OLLAMA_URL || DEFAULT_OLLAMA;
  if(!process.env.OLLAMA_URL) console.warn('OLLAMA_URL not set — using default:', DEFAULT_OLLAMA);
  try{
    // Forward to the configured Ollama endpoint. The payload may need adapting depending on your Ollama API.
    const payload = { message, history, model };
    const r = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 20000
    });
    const text = await r.text();
    // Try to parse JSON otherwise send raw
    try{
      const json = JSON.parse(text);
      return res.json({ ok: true, reply: json });
    }catch(e){
      return res.json({ ok: true, reply: text });
    }
  }catch(err){
    console.error('ollama proxy error', err);
    // If the Ollama endpoint is not reachable (e.g. ECONNREFUSED), return a demo echo
    // so the UI can still function for testing.
    if (err && (err.code === 'ECONNREFUSED' || String(err).includes('ECONNREFUSED'))) {
      return res.json({ demo: true, reply: `Demo: recibí tu mensaje: "${message}". Ollama no está disponible en ${OLLAMA_URL}` });
    }
    res.status(502).json({ error: 'Failed to reach Ollama endpoint', details: String(err) });
  }
});

app.listen(port, ()=>{
  console.log(`Ollama proxy listening on http://localhost:${port}`);
  if(!process.env.OLLAMA_URL) console.log(`Warning: OLLAMA_URL not set — proxy will attempt default ${DEFAULT_OLLAMA}. Set OLLAMA_URL to change it.`);
});
