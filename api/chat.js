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
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + getKey() },
      body: JSON.stringify({
        model: process.env.MODEL || "llama-3.3-70b-versatile",
        max_tokens: Math.min(Number(max_tokens) || 300, 800),
        temperature: 0.6,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: (d.error && d.error.message) || "upstream error" });
    res.status(200).json({ text: (d.choices && d.choices[0] && d.choices[0].message.content) || "" });
  } catch (e) { res.status(500).json({ error: "server error: " + (e && e.message ? e.message : e) }); }
};
