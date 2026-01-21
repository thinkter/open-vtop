#!/usr/bin/env node
const { spawn } = require("child_process");
const { exec } = require("child_process");
const { platform } = require("os");
const path = require("path");

const args = process.argv.slice(2);
const showLogs = args.includes("logs");

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

const PORT = 6767;
const URL = `http://localhost:${PORT}`;

function openBrowser(url) {
  const plat = platform();
  let command;

  switch (plat) {
    case "darwin":
      command = `open "${url}"`;
      break;
    case "win32":
      command = `start "" "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.log(
        `${colors.yellow}Could not open browser automatically. Please visit: ${url}${colors.reset}`,
      );
    }
  });
}

function printBanner() {
  console.log();
  console.log(
    `${colors.cyan}${colors.bold}  ┌───────────────────────────────────────┐${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bold}  │           ${colors.magenta}open-vtop${colors.cyan}                   │${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bold}  └───────────────────────────────────────┘${colors.reset}`,
  );
  console.log();
  console.log(
    `  ${colors.green}✓${colors.reset} Server running at ${colors.bold}${URL}${colors.reset}`,
  );
  console.log();
  console.log(`  ${colors.dim}Keyboard shortcuts:${colors.reset}`);
  console.log(`    ${colors.bold}q${colors.reset}  →  Quit server`);
  console.log(`    ${colors.bold}o${colors.reset}  →  Open browser`);
  console.log(`    ${colors.bold}c${colors.reset}  →  Clear console`);
  console.log();
}

let serverProcess = null;

function shutdown() {
  console.log(`\n${colors.yellow}Shutting down server...${colors.reset}`);
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
  // Restore terminal to normal mode before exiting
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.exit(0);
}

function setupKeyboardShortcuts() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (key) => {
      switch (key.toLowerCase()) {
        case "q":
        case "\u0003": // Ctrl+C
          shutdown();
          break;
        case "o":
          console.log(`${colors.dim}Opening browser...${colors.reset}`);
          openBrowser(URL);
          break;
        case "c":
          console.clear();
          printBanner();
          break;
      }
    });
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const serverPath = path.join(__dirname, "index.js");
serverProcess = spawn(process.execPath, [serverPath], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, OPEN_VTOP_CLI: "true" },
});

serverProcess.stdout.on("data", (data) => {
  const text = data.toString();
  if (text.includes("Server is running")) {
    printBanner();
    setupKeyboardShortcuts();
    openBrowser(URL);
  } else if (showLogs) {
    process.stdout.write(data);
  }
});

serverProcess.stderr.on("data", (data) => {
  if (showLogs) {
    process.stderr.write(data);
  }
});

serverProcess.on("error", (err) => {
  console.error(
    `${colors.yellow}Failed to start server: ${err.message}${colors.reset}`,
  );
  process.exit(1);
});

serverProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.log(
      `${colors.yellow}Server exited with code ${code}${colors.reset}`,
    );
  }
  process.exit(code || 0);
});
