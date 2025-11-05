# SAES Ollama Proxy

This is a tiny proxy to connect the ALMA web UI to an Ollama HTTP endpoint.

Usage

1. Install dependencies

```powershell
cd saes/ollama-server
npm install
```

2. Set your Ollama HTTP endpoint and start the server

```powershell
# Example for local Ollama (change to your endpoint if different)
$env:OLLAMA_URL = 'http://localhost:11434/api/generate'
node index.js
```

If you don't set `OLLAMA_URL`, the server will attempt a sensible default (`http://localhost:11434/api/generate`).
If that local Ollama endpoint is not running you will see connection errors from the proxy. To explicitly set `OLLAMA_URL` for the current PowerShell session:

```powershell
$env:OLLAMA_URL = 'http://localhost:11434/api/generate'
node index.js
```

Or run using the npm script (from the `saes/ollama-server` folder):

```powershell
npm start
```

Client integration

The web UI includes a small chat widget that sends POST /ollama-chat with JSON `{ message }`. The proxy listens by default on port 3002 (so it won't conflict if Ollama is running on 3001).

The proxy forwards incoming requests to the configured `OLLAMA_URL` and returns the model reply. If you changed the proxy port, update the client `saes/js/ollama-bot.js` to point to `http://localhost:<PORT>/ollama-chat`.

Notes

- Ollama's HTTP API endpoint and payload shape may vary depending on your Ollama version; adjust `index.js` to match your local Ollama API. This proxy intentionally accepts a simple `{message, history, model}` JSON and forwards it as-is.
- For production or secure setups, add authentication and CORS restrictions as needed.
