import fs from "fs";
import { execSync } from "child_process";

const diff = execSync("git status --porcelain || true").toString();
const logs = {
  lint: execSync("npm run lint || true").toString(),
  build: execSync("npm run build || true").toString(),
  tests: execSync("npm test || true").toString(),
  lhci: execSync("npx lhci collect || true && npx lhci assert || true").toString()
};

const prompt = `
ROLE: Senior Web+AI Engineer. Repo = static site (Netlify).
GOAL: Fix ALL failing calculators, CSP/CSS path issues, 404s, and Lighthouse <90.
CONTEXT:
- git status: ${diff}
- lint/build/test/lhci logs: ${JSON.stringify(logs).slice(0, 120000)}
RULES:
- No inline JS. No CDN; use /assets or /vendor.
- Keep 'script-src self' with nonces; update netlify.toml/headers if needed.
- Produce a unified patch (git diff) only.`;

async function ask(model, key, msg) {
  const url = model === "anthropic"
    ? "https://api.anthropic.com/v1/messages"
    : "https://api.openai.com/v1/chat/completions";

  const body = model === "anthropic" ? {
    model: "claude-3-7-sonnet",
    max_tokens: 4000,
    messages: [{ role: "user", content: msg }]
  } : {
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: msg }],
    temperature: 0
  };

  const headers = model === "anthropic"
    ? { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" }
    : { authorization: "Bearer " + key, "content-type": "application/json" };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const data = await response.json();
  return model === "anthropic"
    ? data.content?.[0]?.text
    : data.choices?.[0]?.message?.content;
}

const patch = (await ask("anthropic", process.env.ANTHROPIC_API_KEY, prompt)) || "";

if (!patch.includes("diff --git")) {
  process.exit(0);
}

fs.writeFileSync("ai.patch", patch);

try {
  execSync("git apply -p0 ai.patch");
} catch (error) {
  process.exit(0);
}
