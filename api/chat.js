// FALLBACK (only if env vars refuse to work AND your GitHub repo is PRIVATE): paste your key between the quotes below.
const FALLBACK_KEY = "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";
const getKey = () => (process.env.GROQ_API_KEY || FALLBACK_KEY || "").trim();
// Serverless proxy: keeps the API key on the server (Vercel env var), never in the browser.
module.exports = async (req, res) => {
  if (req.method === "GET") return res.status(200).json({ ok: true, keySet: !!getKey(), keyLooksValid: getKey().startsWith("gsk_") });
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { prompt, max_tokens } = req.body || {};
  if (typeof prompt !== "string" || prompt.length > 12000) return res.status(400).json({ error: "bad prompt" });
  if (!getKey()) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  try {
    const models = [process.env.MODEL, "llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-20b", "gemma2-9b-it"].filter(Boolean);
    let lastErr = "upstream error";
    for (const model of models) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + getKey() },
        body: JSON.stringify({ model, max_tokens: Math.min(Number(max_tokens) || 300, 800), temperature: 0.6, messages: [{ role: "user", content: prompt }] })
      });
      const d = await r.json();
      if (r.ok) return res.status(200).json({ text: (d.choices && d.choices[0] && d.choices[0].message.content) || "", model });
      lastErr = (d.error && d.error.message) || lastErr;
      if (r.status !== 400 && r.status !== 403 && r.status !== 404) break; // only try next model for model-access errors
    }
    return res.status(502).json({ error: lastErr });
  } catch (e) { res.status(500).json({ error: "server error: " + (e && e.message ? e.message : e) }); }
};
