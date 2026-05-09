import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const port = Number(process.argv[2] || 5199);
const outDir = path.resolve(process.argv[3] || "artifacts/visual-compare/mood-states/figma");

await fs.mkdir(outDir, { recursive: true });

function safeName(value) {
  return decodeURIComponent(value || "frame.png").replace(/[^a-z0-9_.-]/gi, "_");
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (req.method !== "POST" || !req.url?.startsWith("/upload/")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Use POST /upload/<filename>" }));
    return;
  }

  try {
    const name = safeName(req.url.slice("/upload/".length));
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const filePath = path.join(outDir, name);
    await fs.writeFile(filePath, buffer);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, name, bytes: buffer.length, filePath }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`figma-upload-receiver ready on http://127.0.0.1:${port}`);
  console.log(`writing PNGs to ${outDir}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
