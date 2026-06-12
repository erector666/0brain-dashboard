import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

export type AppConfig = {
  apiBase: string;
  apiKey: string;
  port: number;
};

const DEFAULT_API_BASE = "https://guvkubaqeojncfwnnccf.supabase.co/functions/v1/agent-memory-api";
const HERMES_ENV = "\\\\wsl.localhost\\Ubuntu\\root\\.hermes\\.env";

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    out[key] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

export function loadConfig(cwd = process.cwd()): AppConfig {
  dotenv.config({ path: path.join(cwd, ".env.local"), override: false });
  dotenv.config({ path: path.join(cwd, ".env"), override: false });

  const hermesEnv = parseEnvFile(HERMES_ENV);
  const apiKey = process.env.OBRAIN_API_KEY || hermesEnv.OBRAIN_API_KEY || "";
  const apiBase = process.env.OBRAIN_API_BASE || hermesEnv.OBRAIN_API_BASE || DEFAULT_API_BASE;
  const port = Number(process.env.PORT || 8787);

  if (!apiKey) {
    throw new Error("OBRAIN_API_KEY is missing. Add it to .env.local or the local Hermes .env.");
  }

  return {
    apiBase: apiBase.replace(/\/+$/, ""),
    apiKey,
    port: Number.isFinite(port) ? port : 8787
  };
}
