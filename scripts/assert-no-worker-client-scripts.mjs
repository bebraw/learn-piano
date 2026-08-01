import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, relative, resolve } from "node:path";
import process from "node:process";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const runtimeRoots = ["src/worker.ts", "src/views"];
const ignoredFilePatterns = [/\.test\.ts$/, /\.e2e\.ts$/, /\.d\.ts$/];

const disallowedAttributePatterns = [
  {
    name: "inline event handler attribute",
    pattern: /\son[a-z]+\s*=/giu,
  },
];

const htmlAttributePattern = /\s[a-z_:][a-z0-9_.:-]*\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/giu;
const namedUrlCharacterReferences = new Map([
  ["colon", ":"],
  ["newline", "\n"],
  ["tab", "\t"],
]);

export function findBrowserCodeViolations(source) {
  const violations = [...findScriptViolations(source), ...findJavascriptUrlViolations(source)];

  for (const { name, pattern } of disallowedAttributePatterns) {
    for (const match of source.matchAll(pattern)) {
      violations.push({ index: match.index ?? 0, name });
    }
  }

  return violations.sort((left, right) => left.index - right.index);
}

function findJavascriptUrlViolations(source) {
  const violations = [];

  for (const match of source.matchAll(htmlAttributePattern)) {
    const rawValue = match[1] ?? match[2] ?? match[3] ?? "";
    const normalizedValue = decodeHtmlCharacterReferences(rawValue)
      .replaceAll("\t", "")
      .replaceAll("\n", "")
      .replaceAll("\r", "")
      .trimStart();

    if (!/^javascript\s*:/iu.test(normalizedValue)) {
      continue;
    }

    violations.push({
      index: (match.index ?? 0) + getAttributeValueOffset(match[0]),
      name: "javascript: URL",
    });
  }

  return violations;
}

function decodeHtmlCharacterReferences(value) {
  return value
    .replace(/&#x([0-9a-f]+);?/giu, (_reference, digits) => decodeNumericCharacterReference(digits, 16))
    .replace(/&#([0-9]+);?/gu, (_reference, digits) => decodeNumericCharacterReference(digits, 10))
    .replace(/&(colon|newline|tab);?/giu, (reference, name) => namedUrlCharacterReferences.get(name.toLowerCase()) ?? reference);
}

function decodeNumericCharacterReference(digits, radix) {
  const codePoint = Number.parseInt(digits, radix);

  if (!Number.isSafeInteger(codePoint) || codePoint <= 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
    return "\ufffd";
  }

  return String.fromCodePoint(codePoint);
}

function getAttributeValueOffset(attributeSource) {
  const separatorIndex = attributeSource.indexOf("=");
  const valueSource = attributeSource.slice(separatorIndex + 1);
  const leadingWhitespace = /^\s*/u.exec(valueSource)?.[0].length ?? 0;
  const quoteLength = valueSource[leadingWhitespace] === '"' || valueSource[leadingWhitespace] === "'" ? 1 : 0;
  return separatorIndex + 1 + leadingWhitespace + quoteLength;
}

async function runGuard(args) {
  const files = args.length > 0 ? collectRequestedRuntimeFiles(args) : await collectRuntimeFiles(runtimeRoots);
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");

    for (const violation of findBrowserCodeViolations(source)) {
      violations.push(formatViolation(file, source, violation.index, violation.name));
    }
  }

  if (violations.length === 0) {
    return 0;
  }

  console.error("Worker-rendered HTML may load only empty same-origin external module scripts.");
  console.error("Move browser behavior into typed TypeScript modules before serving it to clients.");
  console.error("");
  console.error(violations.join("\n"));
  return 1;
}

function findScriptViolations(source) {
  const violations = [];
  const matchedRanges = [];

  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/giu)) {
    const index = match.index ?? 0;
    matchedRanges.push({ end: index + match[0].length, start: index });

    const violationName = validateScriptElement(match[1] ?? "", match[2] ?? "");

    if (violationName !== undefined) {
      violations.push({ index, name: violationName });
    }
  }

  for (const match of source.matchAll(/<\/?script\b[^>]*(?:>|$)/giu)) {
    const index = match.index ?? 0;

    if (!matchedRanges.some((range) => index >= range.start && index < range.end)) {
      violations.push({ index, name: "unpaired <script> tag" });
    }
  }

  return violations;
}

function validateScriptElement(rawAttributes, body) {
  if (body.trim() !== "") {
    return "inline <script> body";
  }

  const attributes = parseAttributes(rawAttributes);

  if (attributes === undefined) {
    return "unverifiable <script> attributes";
  }

  const type = attributes.get("type");

  if (type?.toLowerCase() !== "module") {
    return "non-module <script> tag";
  }

  const source = attributes.get("src");

  if (typeof source !== "string") {
    return "<script> tag without src";
  }

  if (!isSameOriginScriptSource(source)) {
    return "non-same-origin <script> src";
  }

  return undefined;
}

function parseAttributes(source) {
  const attributes = new Map();
  let offset = 0;

  while (offset < source.length) {
    const whitespace = /^\s+/u.exec(source.slice(offset));

    if (whitespace !== null) {
      offset += whitespace[0].length;
    }

    if (offset >= source.length) {
      break;
    }

    const nameMatch = /^[a-z_:][a-z0-9_.:-]*/iu.exec(source.slice(offset));

    if (nameMatch === null) {
      return undefined;
    }

    const name = nameMatch[0].toLowerCase();
    offset += nameMatch[0].length;

    if (attributes.has(name)) {
      return undefined;
    }

    const separator = /^\s*/u.exec(source.slice(offset));
    offset += separator?.[0].length ?? 0;

    if (source[offset] !== "=") {
      attributes.set(name, null);
      continue;
    }

    offset += 1;
    const valueWhitespace = /^\s*/u.exec(source.slice(offset));
    offset += valueWhitespace?.[0].length ?? 0;

    const quote = source[offset];

    if (quote !== '"' && quote !== "'") {
      return undefined;
    }

    const valueStart = offset + 1;
    const valueEnd = source.indexOf(quote, valueStart);

    if (valueEnd === -1) {
      return undefined;
    }

    attributes.set(name, source.slice(valueStart, valueEnd));
    offset = valueEnd + 1;
  }

  return attributes;
}

function isSameOriginScriptSource(source) {
  if (
    source === "" ||
    source.trim() !== source ||
    source.includes("${") ||
    source.includes("&") ||
    /\s|\\/u.test(source) ||
    source.startsWith("//") ||
    source.startsWith("?") ||
    source.startsWith("#") ||
    /^[a-z][a-z\d+.-]*:/iu.test(source)
  ) {
    return false;
  }

  const baseUrl = new URL("https://worker-client-guard.invalid/current/page");

  try {
    return new URL(source, baseUrl).origin === baseUrl.origin;
  } catch {
    return false;
  }
}

async function collectRuntimeFiles(paths) {
  const files = [];

  for (const path of paths) {
    const absolutePath = join(repoRoot, path);

    if (path.endsWith(".ts")) {
      files.push(absolutePath);
      continue;
    }

    files.push(...(await collectTypeScriptFiles(absolutePath)));
  }

  return files.filter((file) => ignoredFilePatterns.every((pattern) => !pattern.test(file))).sort();
}

function collectRequestedRuntimeFiles(paths) {
  return paths
    .filter((file) => (file === "src/worker.ts" || file.startsWith("src/views/")) && file.endsWith(".ts"))
    .filter((file) => ignoredFilePatterns.every((pattern) => !pattern.test(file)))
    .map((file) => join(repoRoot, file))
    .sort();
}

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function formatViolation(file, source, index, name) {
  const location = getLocation(source, index);
  const line = source.split("\n")[location.line - 1]?.trim() ?? "";
  return `${relative(repoRoot, file)}:${location.line}:${location.column} - ${name}\n  ${line}`;
}

function getLocation(source, index) {
  const prefix = source.slice(0, index);
  const lines = prefix.split("\n");
  const currentLine = lines.at(-1) ?? "";

  return {
    line: lines.length,
    column: currentLine.length + 1,
  };
}

function isDirectRun() {
  const entryPath = process.argv[1];
  return entryPath !== undefined && pathToFileURL(resolve(entryPath)).href === import.meta.url;
}

if (isDirectRun()) {
  process.exitCode = await runGuard(process.argv.slice(2));
}
