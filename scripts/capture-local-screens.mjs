import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const moodCases = [
  { name: "tasks-list", page: "tasks", demo: "media" },
  { name: "home-high", page: "home", demo: "alta" },
  { name: "home-neutral", page: "home", demo: "media" },
  { name: "home-low", page: "home", demo: "baixa" },
  { name: "home-protect", page: "home", demo: "protetivo" },
  { name: "focus-high", page: "focus", demo: "alta" },
  { name: "focus-neutral", page: "focus", demo: "media" },
  { name: "focus-low", page: "focus", demo: "baixa" },
  { name: "focus-protect", page: "focus", demo: "protetivo" },
];

const allCases = [
  { name: "onboarding", path: "index.html" },
  { name: "checkin", path: "pages/checkin.html" },
  { name: "checkin-success", path: "pages/checkin-success.html" },
  { name: "home", path: "pages/home.html", demo: "media" },
  { name: "planning", path: "pages/planning.html", demo: "media" },
  { name: "planning-adjust", path: "pages/planning-adjust.html", demo: "media" },
  { name: "tasks", path: "pages/tasks.html" },
  { name: "task-new", path: "pages/task-new.html" },
  { name: "task-edit", path: "pages/task-edit.html" },
  { name: "calendar-week", path: "pages/calendar-week.html" },
  { name: "calendar-month", path: "pages/calendar-month.html" },
  { name: "habits", path: "pages/habits.html" },
  { name: "habit-new", path: "pages/habit-new.html" },
  { name: "habit-edit", path: "pages/habit-edit.html" },
  { name: "habit-templates", path: "pages/habit-templates.html" },
  { name: "micro-pauses", path: "pages/micro-pauses.html" },
  { name: "focus", path: "pages/focus.html", demo: "media" },
  { name: "focus-session", path: "pages/focus-session.html" },
  { name: "focus-break", path: "pages/focus-break.html" },
  { name: "journal", path: "pages/journal.html" },
  { name: "journal-night", path: "pages/journal-night.html" },
  { name: "notes", path: "pages/notes.html" },
  { name: "dashboard", path: "pages/dashboard.html" },
  { name: "dashboard-history", path: "pages/dashboard-history.html" },
  { name: "dashboard-operational", path: "pages/dashboard-operational.html" },
  { name: "export", path: "pages/export.html" },
  { name: "export-success", path: "pages/export-success.html" },
  { name: "export-ready", path: "pages/export-ready.html" },
  { name: "goals", path: "pages/goals.html" },
  { name: "settings", path: "pages/settings.html" },
  { name: "reminders", path: "pages/reminders.html" },
  { name: "empty-states", path: "pages/empty-states.html" },
  { name: "prototype-overview", path: "pages/prototype-overview.html" },
  { name: "checkin-states", path: "pages/checkin-states.html" },
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

const root = path.resolve(argValue("--root", path.join(import.meta.dirname, "..")));
const baseUrl = argValue("--base-url", "http://127.0.0.1:5177");
const explicitBrowser = argValue("--browser", "");
const caseSet = argValue("--case-set", "mood");
const localDir = path.resolve(argValue("--out-dir", path.join(root, "artifacts", "visual-compare", caseSet === "all" ? "all-screens" : "mood-states", "local")));
const cases = caseSet === "all" ? allCases : moodCases;

function browserCandidates() {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  return [
    explicitBrowser,
    path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
  ].filter(Boolean);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findBrowser() {
  for (const candidate of browserCandidates()) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error("Nenhum browser Chromium encontrado para captura CDP.");
}

async function waitForVersion(port) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error("Timeout aguardando DevTools Protocol.");
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = [];
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }
    for (const listener of [...this.listeners]) listener(message);
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  once(method, sessionId) {
    return new Promise((resolve) => {
      const listener = (message) => {
        if (message.method === method && (!sessionId || message.sessionId === sessionId)) {
          this.listeners = this.listeners.filter((item) => item !== listener);
          resolve(message.params || {});
        }
      };
      this.listeners.push(listener);
    });
  }

  close() {
    this.ws.close();
  }
}

async function captureCase(client, item) {
  const target = await client.send("Target.createTarget", { url: "about:blank" });
  const attached = await client.send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true,
  });
  const sessionId = attached.sessionId;
  const filePath = item.path || `pages/${item.page}.html`;
  const query = new URLSearchParams();
  if (item.demo) query.set("demo", item.demo);
  query.set("v", "visual-compare-cdp");
  const url = `${baseUrl}/${filePath}?${query.toString()}`;
  const outputPath = path.join(localDir, `${item.name}.png`);

  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 390,
    screenHeight: 844,
  }, sessionId);

  const loaded = client.once("Page.loadEventFired", sessionId);
  await client.send("Page.navigate", { url }, sessionId);
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, 650));

  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  }, sessionId);

  await fs.writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
  await client.send("Target.closeTarget", { targetId: target.targetId });
  return { name: item.name, url, outputPath };
}

await fs.mkdir(localDir, { recursive: true });

const browser = await findBrowser();
const port = 9400 + Math.floor(Math.random() * 400);
const profileDir = path.join(os.tmpdir(), `plenna-cdp-${Date.now()}`);
const browserProcess = spawn(browser, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--disable-dev-shm-usage",
  `--user-data-dir=${profileDir}`,
  `--remote-debugging-port=${port}`,
  "about:blank",
], { stdio: "ignore" });

try {
  const version = await waitForVersion(port);
  const client = new CdpClient(version.webSocketDebuggerUrl);
  await client.connect();

  const captured = [];
  for (const item of cases) captured.push(await captureCase(client, item));

  client.close();
  console.log(JSON.stringify({ viewport: "390x844", localDir, captured }, null, 2));
} finally {
  browserProcess.kill();
}
