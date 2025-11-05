// Minimal mock Ollama-like HTTP endpoint for development
// Listens on port 3001 and responds to POST /api/generate with a simple JSON reply.
const http = require('http');

const PORT = 3001;

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate') {
    try {
      const raw = await getBody(req);
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch(_) { parsed = { raw }; }
      const prompt = parsed.prompt || parsed.message || (parsed.input) || 'sin prompt';
      const replyText = `Simulated Ollama reply to: "${prompt}"`;
      const response = { generated: replyText };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Mock Ollama listening on http://localhost:${PORT}/api/generate`);
});
