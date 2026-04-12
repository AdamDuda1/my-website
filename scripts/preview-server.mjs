import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const PORT = Number(process.env.PORT || 8080);
const ROOT = resolve(process.cwd());

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const target = decoded === "/" ? "/index.html" : decoded;
  const filePath = normalize(join(ROOT, target));

  if (!filePath.startsWith(ROOT)) {
    return null;
  }

  return filePath;
}

const server = createServer(async (req, res) => {
  const filePath = safePath(req.url || "/");

  if (!filePath) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  try {
    const data = await readFile(filePath);
    const contentType = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Preview server running: http://localhost:${PORT}`);
});

