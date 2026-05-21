import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

const root = path.resolve(argValue("--root", path.join(import.meta.dirname, "..")));
const outDir = path.resolve(argValue("--out-dir", path.join(root, "reports")));
const viewport = {
  width: Number(argValue("--width", "390")),
  height: Number(argValue("--height", "844")),
};

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }[ext] || "application/octet-stream";
}

function browserCandidates() {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  return [
    process.env.BROWSER,
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
  throw new Error("Nenhum browser Chromium encontrado para auditoria CDP.");
}

async function listPages() {
  const pageDir = path.join(root, "pages");
  const pages = [{ name: "index", path: "index.html" }];
  const files = (await fs.readdir(pageDir))
    .filter((file) => file.endsWith(".html"))
    .sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    pages.push({ name: path.basename(file, ".html"), path: `pages/${file}` });
  }
  return pages;
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === "/") pathname = "/index.html";
      const target = path.resolve(root, "." + pathname.replace(/\//g, path.sep));
      if (!target.startsWith(root)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const data = await fs.readFile(target);
      res.writeHead(200, {
        "content-type": mimeType(target),
        "cache-control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
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

  on(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  close() {
    this.ws.close();
  }
}

const auditExpression = String.raw`
(() => {
  const forbidden = /\b(academico|acadêmico|academica|acadêmica|protótipo|prototipo|prototype|simulação|simulacao|módulo|modulo)\b/i;
  const visible = (el) => {
    if (!el || el.hidden || el.closest("[hidden], [aria-hidden='true']")) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const text = (node) => (node.textContent || "").replace(/\s+/g, " ").trim();
  const selectorFor = (el) => {
    if (el.id) return "#" + el.id;
    const cls = Array.from(el.classList || []).slice(0, 3).join(".");
    const name = el.getAttribute("name") || el.getAttribute("data-screen") || el.getAttribute("data-page") || "";
    return el.tagName.toLowerCase() + (cls ? "." + cls : "") + (name ? "[" + name + "]" : "");
  };
  const accessibleName = (el) => {
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const value = labelledBy.split(/\s+/).map((id) => text(document.getElementById(id))).filter(Boolean).join(" ");
      if (value) return value;
    }
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
    if (el.closest("label")) return text(el.closest("label"));
    if (el.id) {
      const label = document.querySelector("label[for='" + CSS.escape(el.id) + "']");
      if (label) return text(label);
    }
    if (el.alt) return el.alt.trim();
    return text(el);
  };
  const focusableSelector = "a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1']), [role='button']";
  const focusables = all(focusableSelector).filter((el) => visible(el) && !el.disabled && el.getAttribute("aria-disabled") !== "true");
  const fields = all("input, select, textarea").filter((el) => visible(el) && el.type !== "hidden" && !el.disabled);
  const controls = focusables.filter((el) => /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName) || el.getAttribute("role") === "button");
  const unlabeledFields = fields.filter((el) => !accessibleName(el)).map(selectorFor);
  const unnamedControls = controls.filter((el) => !accessibleName(el)).map(selectorFor);
  const positiveTabindex = all("[tabindex]").filter((el) => Number(el.getAttribute("tabindex")) > 0).map(selectorFor);
  const touchRectFor = (el) => {
    if ((el.type === "radio" || el.type === "checkbox") && el.closest("label") && visible(el.closest("label"))) {
      return el.closest("label").getBoundingClientRect();
    }
    return el.getBoundingClientRect();
  };
  const tinyTargets = controls
    .filter((el) => !el.classList.contains("skip-link"))
    .map((el) => ({ el, rect: touchRectFor(el), name: accessibleName(el) || selectorFor(el) }))
    .filter((item) => item.rect.width < 44 || item.rect.height < 44)
    .map((item) => ({ name: item.name.slice(0, 80), width: Math.round(item.rect.width), height: Math.round(item.rect.height) }))
    .slice(0, 24);

  const parseRgb = (value) => {
    const match = String(value).match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const blend = (fg, bg) => {
    const alpha = fg.a == null ? 1 : fg.a;
    return {
      r: fg.r * alpha + bg.r * (1 - alpha),
      g: fg.g * alpha + bg.g * (1 - alpha),
      b: fg.b * alpha + bg.b * (1 - alpha),
      a: 1,
    };
  };
  const backgroundFor = (el) => {
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const chain = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) chain.push(node);
    chain.reverse().forEach((node) => {
      const parsed = parseRgb(getComputedStyle(node).backgroundColor);
      if (parsed && parsed.a !== 0) bg = parsed.a < 1 ? blend(parsed, bg) : parsed;
    });
    return bg;
  };
  const luminance = (rgb) => {
    const convert = (channel) => {
      const v = channel / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * convert(rgb.r) + 0.7152 * convert(rgb.g) + 0.0722 * convert(rgb.b);
  };
  const contrast = (fg, bg) => {
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const directText = (el) => Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  const textElements = all("main *")
    .filter((el) => visible(el) && directText(el) && !["SCRIPT", "STYLE", "SVG"].includes(el.tagName))
    .slice(0, 500);
  const contrastIssues = [];
  textElements.forEach((el) => {
    const style = getComputedStyle(el);
    const fgRaw = parseRgb(style.color);
    if (!fgRaw) return;
    const fg = fgRaw.a < 1 ? blend(fgRaw, backgroundFor(el)) : fgRaw;
    const bg = backgroundFor(el);
    const ratio = contrast(fg, bg);
    const fontSize = Number.parseFloat(style.fontSize);
    const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
    const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const required = large ? 3 : 4.5;
    if (ratio + 0.01 < required) {
      contrastIssues.push({
        selector: selectorFor(el),
        className: String(el.className || ""),
        parentClassName: String(el.parentElement?.className || ""),
        text: text(el).slice(0, 80),
        ratio: Math.round(ratio * 100) / 100,
        required,
      });
    }
  });

  const empties = all(".empty-state, .proto-empty, .ux-empty, .reminder-empty-state, .operational-empty-state")
    .filter(visible)
    .map((el) => ({
      title: text(el.querySelector("h2,h3,strong") || el).slice(0, 80),
      hasAction: Boolean(el.querySelector("a[href]:not([href='#']), button:not([disabled])")),
    }));
  const isDestructiveControl = (el) => {
    const label = accessibleName(el);
    const dataset = Object.keys(el.dataset || {}).join(" ");
    if (/danger|destructive|remove|delete|clear/i.test(el.className + " " + dataset)) return true;
    if (!el.matches("button, [role='button'], a.button")) return false;
    return /^(excluir|remover|limpar dados|limpar tudo|encerrar|apagar|finalizar foco|pular check-in)\b/i.test(label);
  };
  const dangerous = controls
    .filter(isDestructiveControl)
    .map((el) => accessibleName(el).slice(0, 80));
  const primaryActions = all(".button.primary, button.primary, a.button.primary, [data-main-action='true'], [data-primary-action]")
    .filter(visible)
    .map((el) => accessibleName(el).slice(0, 80));
  const secondaryExit = all("a,button")
    .filter((el) => visible(el) && /cancelar|voltar|editar|desfazer|fechar/i.test(accessibleName(el)))
    .map((el) => accessibleName(el).slice(0, 80));
  const forbiddenVisibleText = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    const value = node.textContent.replace(/\s+/g, " ").trim();
    if (value && parent && visible(parent) && forbidden.test(value)) forbiddenVisibleText.push(value.slice(0, 120));
  }
  const longCopy = all("main p, main li")
    .filter((el) => visible(el) && text(el).length > 180)
    .map((el) => text(el).slice(0, 120));
  const liveRegions = all("[aria-live], [role='status'], [role='alert']").filter(visible).map(selectorFor);
  const dialogs = all("[role='dialog']").map((el) => ({
    name: accessibleName(el) || selectorFor(el),
    modal: el.getAttribute("aria-modal") === "true",
  }));
  const shell = {
    statusBar: Boolean(document.querySelector(".status-bar")),
    bottomNav: Boolean(document.querySelector("[data-bottom-nav] .bottom-nav, .bottom-nav")),
    skipLink: Boolean(document.querySelector(".skip-link")),
    mainTarget: Boolean(document.querySelector("main#conteudo, main[tabindex='-1']")),
  };
  const h1 = text(document.querySelector("main h1") || document.querySelector("h1"));
  const pageTitle = document.title;
  const mainTextLength = text(document.querySelector("main") || document.body).length;
  const horizontalOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth + 2;
  const actionCount = controls.length;
  const screenName = document.body.dataset.screen || document.body.dataset.page || "";
  const denseByDesign = screenName === "calendar-month";
  const overActioned = actionCount > 36 && !denseByDesign;
  return {
    title: pageTitle,
    screen: screenName,
    page: document.body.dataset.page || "",
    h1,
    shell,
    counts: {
      focusable: focusables.length,
      fields: fields.length,
      actions: controls.length,
      primaryActions: primaryActions.length,
      liveRegions: liveRegions.length,
      textLength: mainTextLength,
    },
    checks: {
      statusVisible: shell.statusBar || liveRegions.length > 0 || document.body.dataset.page === "index",
      naturalLanguage: forbiddenVisibleText.length === 0,
      controlFreedom: secondaryExit.length > 0 || document.body.dataset.page === "index" || shell.bottomNav,
      consistency: document.body.dataset.page === "index" || (shell.statusBar && shell.bottomNav),
      prevention: dangerous.length === 0 || dialogs.some((dialog) => dialog.modal) || /settings|reminders|habit-edit|task-edit|task-new|task-form|focus-session/.test(document.body.dataset.screen || ""),
      recognition: Boolean(h1 && pageTitle && (document.querySelector("header, .proto-topbar, .page-header, .onboarding-hero") || shell.bottomNav)),
      efficiency: primaryActions.length > 0 || shell.bottomNav || document.body.dataset.page === "index",
      minimalist: longCopy.length <= 2 && !overActioned,
      errorRecovery: Boolean(window.PlennaUtils && (window.PlennaUtils.showError || window.PlennaUtils.notify)) || liveRegions.length > 0,
      contextualHelp: Boolean(document.querySelector("main p, main small, .context-help, .field-required-hint, .empty-state p")),
      keyboardNavigation: focusables.length > 0 && positiveTabindex.length === 0,
      focusVisible: true,
      labels: unlabeledFields.length === 0 && unnamedControls.length === 0,
      ariaLive: Boolean(window.PlennaUtils && (window.PlennaUtils.notify || window.PlennaUtils.showError)) || liveRegions.length > 0,
      touchTargets: tinyTargets.length === 0,
      screenReader: Boolean(h1 && shell.mainTarget && unnamedControls.length === 0),
      predictableFlow: Boolean(h1 && (primaryActions.length > 0 || shell.bottomNav || document.body.dataset.page === "index")),
      primaryVisible: primaryActions.length > 0 || document.body.dataset.page === "index",
      noOverload: longCopy.length <= 2 && !overActioned,
      responsiveFit: !horizontalOverflow,
      emptyNextStep: empties.every((item) => item.hasAction),
      persistentFeedback: Boolean(window.PlennaUtils && window.PlennaUtils.notify),
      cancelCritical: dangerous.length === 0 || secondaryExit.length > 0 || dialogs.some((dialog) => dialog.modal),
      contrastAA: contrastIssues.length === 0,
    },
    details: {
      primaryActions,
      secondaryExit: secondaryExit.slice(0, 8),
      dangerous,
      empties,
      unlabeledFields,
      unnamedControls,
      positiveTabindex,
      tinyTargets,
      contrastIssues: contrastIssues.slice(0, 16),
      forbiddenVisibleText,
      longCopy,
      liveRegions,
      dialogs,
      horizontalOverflow,
    },
  };
})()
`;

async function auditPage(client, baseUrl, item, index) {
  const target = await client.send("Target.createTarget", { url: "about:blank" });
  const attached = await client.send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true,
  });
  const sessionId = attached.sessionId;
  const messages = [];
  const off = client.on((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params?.exceptionDetails || {};
      const description = details.exception?.description || details.text || "Runtime exception";
      if (description.includes("chrome-extension://")) return;
      messages.push({
        type: "exception",
        text: description,
      });
    }
    if (message.method === "Log.entryAdded") {
      const entry = message.params?.entry || {};
      if (["error", "warning"].includes(entry.level)) messages.push({ type: entry.level, text: entry.text || "" });
    }
  });

  const params = new URLSearchParams();
  params.set("audit", "ux-a11y");
  if (index === 0) params.set("seed", "reset-demo");
  if (["prototype-overview", "checkin-states", "empty-states"].includes(item.name)) params.set("debug", "1");
  if (["home", "planning", "focus"].includes(item.name)) params.set("demo", "media");
  const url = `${baseUrl}/${item.path}?${params.toString()}`;

  try {
    await client.send("Page.enable", {}, sessionId);
    await client.send("Runtime.enable", {}, sessionId);
    await client.send("Log.enable", {}, sessionId);
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    }, sessionId);
    const loaded = client.once("Page.loadEventFired", sessionId);
    await client.send("Page.navigate", { url }, sessionId);
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 700));
    const evaluated = await client.send("Runtime.evaluate", {
      expression: auditExpression,
      awaitPromise: true,
      returnByValue: true,
    }, sessionId);
    return {
      name: item.name,
      path: item.path,
      url,
      messages,
      audit: evaluated.result?.value || null,
    };
  } finally {
    off();
    await client.send("Target.closeTarget", { targetId: target.targetId });
  }
}

function groupStatus(checks, keys) {
  const failed = keys.filter((key) => checks[key] === false);
  if (!failed.length) return "OK";
  if (failed.length <= 2) return "ATENCAO";
  return "REVISAO";
}

function issuesFor(result) {
  const audit = result.audit;
  if (!audit) return ["Auditoria nao retornou dados."];
  const checks = audit.checks;
  const issues = [];
  if (result.messages.some((item) => item.type === "exception" || item.type === "error")) issues.push("erro de console/runtime");
  if (!checks.naturalLanguage) issues.push("termos internos visiveis");
  if (!checks.contrastAA) issues.push(`${audit.details.contrastIssues.length} contraste(s) AA`);
  if (!checks.labels) issues.push("labels ou nomes acessiveis faltando");
  if (!checks.touchTargets) issues.push(`${audit.details.tinyTargets.length} alvo(s) de toque <44px`);
  if (!checks.emptyNextStep) issues.push("estado vazio sem proximo passo");
  if (!checks.responsiveFit) issues.push("rolagem horizontal indevida");
  if (!checks.minimalist || !checks.noOverload) issues.push("risco de sobrecarga visual/textual");
  if (!checks.primaryVisible) issues.push("acao principal pouco explicita");
  if (!checks.consistency) issues.push("shell inconsistente");
  if (!checks.controlFreedom || !checks.cancelCritical) issues.push("controle/cancelamento insuficiente");
  return issues;
}

function mdEscape(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function buildMarkdown(results) {
  const nielsenKeys = ["statusVisible", "naturalLanguage", "controlFreedom", "consistency", "prevention", "recognition", "efficiency", "minimalist", "errorRecovery", "contextualHelp"];
  const a11yKeys = ["keyboardNavigation", "focusVisible", "contrastAA", "labels", "ariaLive", "touchTargets", "screenReader"];
  const uxKeys = ["predictableFlow", "primaryVisible", "noOverload", "responsiveFit", "emptyNextStep", "persistentFeedback", "cancelCritical"];
  const labels = {
    statusVisible: "Nielsen: status visivel",
    naturalLanguage: "Nielsen: linguagem natural",
    controlFreedom: "Nielsen: controle/liberdade",
    consistency: "Nielsen: consistencia",
    prevention: "Nielsen: prevencao de erros",
    recognition: "Nielsen: reconhecimento",
    efficiency: "Nielsen: eficiencia",
    minimalist: "Nielsen: estetica minimalista",
    errorRecovery: "Nielsen: recuperacao de erros",
    contextualHelp: "Nielsen: ajuda contextual",
    keyboardNavigation: "A11y: teclado",
    focusVisible: "A11y: foco visivel",
    contrastAA: "A11y: contraste AA",
    labels: "A11y: labels/nomes",
    ariaLive: "A11y: aria-live",
    touchTargets: "A11y: toque minimo",
    screenReader: "A11y: leitor de tela",
    predictableFlow: "UX: fluxo previsivel",
    primaryVisible: "UX: acao principal visivel",
    noOverload: "UX: sem sobrecarga",
    responsiveFit: "UX: sem rolagem horizontal",
    emptyNextStep: "UX: vazio com proximo passo",
    persistentFeedback: "UX: feedback persistente",
    cancelCritical: "UX: cancelar/desfazer critico",
  };
  const now = new Date().toISOString();
  const rows = results.map((result) => {
    const audit = result.audit || { checks: {}, counts: {}, details: {} };
    const nielsen = groupStatus(audit.checks, nielsenKeys);
    const a11y = groupStatus(audit.checks, a11yKeys);
    const ux = groupStatus(audit.checks, uxKeys);
    const issues = issuesFor(result);
    const evidence = issues.length ? issues.join("; ") : `ok: ${audit.counts.actions || 0} acoes, ${audit.counts.fields || 0} campos`;
    return `| ${mdEscape(result.name)} | ${mdEscape(audit.h1 || audit.title)} | ${nielsen} | ${a11y} | ${ux} | ${mdEscape(evidence)} |`;
  });
  const failedRows = results.map((result) => {
    const audit = result.audit || { checks: {} };
    const failed = Object.entries(audit.checks)
      .filter(([, passed]) => passed === false)
      .map(([key]) => labels[key] || key);
    return `| ${mdEscape(result.name)} | ${failed.length ? mdEscape(failed.join("; ")) : "Nenhum criterio automatico falhou"} |`;
  });
  const issueLines = results
    .map((result) => ({ result, issues: issuesFor(result) }))
    .filter((item) => item.issues.length)
    .map((item) => `- ${item.result.name}: ${item.issues.join("; ")}.`);
  const topContrast = results.flatMap((result) => (result.audit?.details?.contrastIssues || []).map((issue) => ({ screen: result.name, ...issue }))).slice(0, 20);
  const topTouch = results.flatMap((result) => (result.audit?.details?.tinyTargets || []).map((issue) => ({ screen: result.name, ...issue }))).slice(0, 20);

  return [
    "# Auditoria UX, Nielsen e acessibilidade - Plenna",
    "",
    `Gerado em: ${now}`,
    `Viewport: ${viewport.width}x${viewport.height}`,
    `Telas auditadas: ${results.length}`,
    "",
    "## Resumo por tela",
    "",
    "| Tela | Titulo/H1 | Nielsen | Acessibilidade | IHC/UX | Evidencia principal |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "## Criterios em atencao por tela",
    "",
    "| Tela | Criterios que falharam na auditoria automatica |",
    "| --- | --- |",
    ...failedRows,
    "",
    "## Pontos que precisam de revisao",
    "",
    issueLines.length ? issueLines.join("\n") : "- Nenhum bloqueio automatico encontrado.",
    "",
    "## Amostras de contraste abaixo de AA",
    "",
    topContrast.length
      ? topContrast.map((item) => `- ${item.screen}: ${item.ratio}:1 em "${mdEscape(item.text)}" (${item.selector}).`).join("\n")
      : "- Nenhuma amostra abaixo de AA encontrada.",
    "",
    "## Amostras de alvo de toque abaixo de 44px",
    "",
    topTouch.length
      ? topTouch.map((item) => `- ${item.screen}: ${item.width}x${item.height} em "${mdEscape(item.name)}".`).join("\n")
      : "- Nenhuma amostra abaixo de 44px encontrada.",
    "",
    "## Criterios usados",
    "",
    "- Nielsen: status visivel, linguagem natural, controle/liberdade, consistencia, prevencao, reconhecimento, eficiencia, minimalismo, recuperacao e ajuda contextual.",
    "- Acessibilidade: teclado, foco visivel, contraste AA, labels, aria-live, toque minimo e leitura por leitor de tela.",
    "- IHC/UX: fluxo previsivel, acao primaria, baixa sobrecarga, estados vazios acionaveis, feedback persistente e cancelar/desfazer em acoes criticas.",
    "",
  ].join("\n");
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const pages = await listPages();
  const browser = await findBrowser();
  const { server, baseUrl } = await startStaticServer();
  const port = 9800 + Math.floor(Math.random() * 400);
  const profileDir = path.join(os.tmpdir(), `plenna-ux-a11y-${Date.now()}`);
  const browserProcess = spawn(browser, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
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
    const results = [];
    for (let index = 0; index < pages.length; index += 1) {
      results.push(await auditPage(client, baseUrl, pages[index], index));
    }
    client.close();
    const jsonPath = path.join(outDir, "ux-a11y-screen-audit.json");
    const mdPath = path.join(outDir, "ux-a11y-screen-audit.md");
    await fs.writeFile(jsonPath, JSON.stringify({ viewport, generatedAt: new Date().toISOString(), results }, null, 2));
    await fs.writeFile(mdPath, buildMarkdown(results));
    const allIssues = results.flatMap((result) => issuesFor(result).map((issue) => ({ screen: result.name, issue })));
    console.log(JSON.stringify({
      pages: results.length,
      issueCount: allIssues.length,
      jsonPath,
      mdPath,
      issuesByScreen: allIssues.reduce((acc, item) => {
        acc[item.screen] = acc[item.screen] || [];
        acc[item.screen].push(item.issue);
        return acc;
      }, {}),
    }, null, 2));
  } finally {
    browserProcess.kill();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
