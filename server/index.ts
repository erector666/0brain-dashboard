import express from "express";
import { loadConfig } from "./config.js";
import { Ob1Client } from "./ob1Client.js";

const config = loadConfig();
const client = new Ob1Client(config.apiBase, config.apiKey);
const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/api/config", (_req, res) => {
  res.json({ apiBase: config.apiBase, hasApiKey: true });
});

app.get("/api/ob1/health", async (_req, res) => {
  res.json(await client.get("/health"));
});

app.post("/api/ob1/stats", async (req, res) => {
  res.json(await client.post("/stats", req.body));
});

app.get("/api/ob1/memories", async (req, res) => {
  res.json(await client.get("/memories", req.query as Record<string, string>));
});

app.get("/api/ob1/memories/review", async (req, res) => {
  res.json(await client.get("/memories/review", req.query as Record<string, string>));
});

app.get("/api/ob1/memories/:id", async (req, res) => {
  res.json(await client.get(`/memories/${encodeURIComponent(req.params.id)}`));
});

app.patch("/api/ob1/memories/:id/review", async (req, res) => {
  res.json(await client.patch(`/memories/${encodeURIComponent(req.params.id)}/review`, req.body));
});

app.post("/api/ob1/recall", async (req, res) => {
  res.json(await client.post("/recall", req.body));
});

app.get("/api/ob1/recall-traces/:id", async (req, res) => {
  res.json(await client.get(`/recall-traces/${encodeURIComponent(req.params.id)}`));
});

app.post("/api/ob1/delete", async (req, res) => {
  res.json(await client.post("/delete", req.body));
});

app.post("/api/ob1/admin/reembed", async (req, res) => {
  res.json(await client.post("/admin/reembed", req.body));
});

export { app, client };

if (process.env.VERCEL !== "1") {
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`0Brain dashboard API listening on http://127.0.0.1:${config.port}`);
  });
}
