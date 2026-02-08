// check-file-headers.mjs

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { basename, extname } from "path";


const EXTENSIONS = {
  ".ts": "//",
  ".tsx": "//",
  ".js": "//",
  ".jsx": "//",
  ".mjs": "//",
  ".cjs": "//",
  ".sql": "--",
  ".py": "#",
  ".sh": "#",
  ".bash": "#",
  ".yaml": "#",
  ".yml": "#",
  ".css": "block-css",
  ".scss": "block-css",
  ".html": "block-html",
};

const IGNORED_DIRS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".husky",
  "public",
  ".git",
];

function getCommentStyle(ext) {
  return EXTENSIONS[ext] ?? null;
}

function buildHeader(style, filePath) {
  const name = basename(filePath);
  switch (style) {
    case "block-css":
      return `/* ${name} */`;
    case "block-html":
      return `<!-- ${name} -->`;
    default:
      return `${style} ${name}`;
  }
}

function isShebang(line) {
  return line.startsWith("#!");
}

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
    encoding: "utf-8",
  });
  return output
      .trim()
      .split("\n")
      .filter((f) => f.length > 0);
}

function isIgnored(filePath) {
  return IGNORED_DIRS.some(
      (dir) => filePath.startsWith(dir + "/") || filePath.startsWith(dir + "\\")
  );
}

function run() {
  const stagedFiles = getStagedFiles();
  const fixed = [];

  for (const file of stagedFiles) {
    if (isIgnored(file)) continue;

    const ext = extname(file);
    const style = getCommentStyle(ext);
    if (!style) continue;

    const expectedHeader = buildHeader(style, file);

    let content;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    let headerLineIndex = 0;

    if (lines.length > 0 && isShebang(lines[0])) {
      headerLineIndex = 1;
    }

    const currentHeader = lines[headerLineIndex] ?? "";
    const lineAfterHeader = lines[headerLineIndex + 1] ?? undefined;
    const headerCorrect = currentHeader === expectedHeader;
    const blankLineCorrect = lineAfterHeader === "";

    if (headerCorrect && blankLineCorrect) {
      continue;
    }


    let codeStartIndex = headerLineIndex;

    const existingHeaderPattern = buildHeaderPattern(style);
    if (existingHeaderPattern && existingHeaderPattern.test(lines[headerLineIndex])) {
      codeStartIndex = headerLineIndex + 1;
      if (lines[codeStartIndex] === "") {
        codeStartIndex++;
      }
    }

    const before = lines.slice(0, headerLineIndex);
    const after = lines.slice(codeStartIndex);
    const newLines = [...before, expectedHeader, "", ...after];
    const newContent = newLines.join("\n");

    writeFileSync(file, newContent, "utf-8");
    execSync(`git add "${file}"`);
    fixed.push(file);
  }

  if (fixed.length > 0) {
    console.log(
        `\nAuto-fixed file headers in ${fixed.length} file(s):`
    );
    for (const f of fixed) {
      console.log(`   → ${f}`);
    }
    console.log(
        "\nFiles have been updated and re-staged. Commit will proceed.\n"
    );
  }

  process.exit(0);
}

function buildHeaderPattern(style) {
  switch (style) {
    case "block-css":
      return /^\/\*\s+\S+\s+\*\/$/;
    case "block-html":
      return /^<!--\s+\S+\s+-->$/;
    case "//":
      return /^\/\/\s+\S+$/;
    case "--":
      return /^--\s+\S+$/;
    case "#":
      return /^#\s+\S+$/;
    default:
      return null;
  }
}

run();
