import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

const SUPABASE_URL = "https://guvkubaqeojncfwnnccf.supabase.co";
const ALLOWED_EMAILS = process.env.ALLOWED_EMAIL?.split(",").map((e) => e.trim()) || [];

export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    console.warn("SUPABASE_SERVICE_KEY not set — auth will be disabled");
  }

  const supabase = serviceKey
    ? createClient(SUPABASE_URL, serviceKey)
    : null;

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!supabase) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.slice(7);

    supabase.auth.getUser(token)
      .then(({ data, error }) => {
        if (error || !data.user) {
          return res.status(401).json({ error: "Invalid or expired token" });
        }

        const email = data.user.email;
        if (!email) {
          return res.status(401).json({ error: "No email in token" });
        }

        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
          return res.status(403).json({ error: "Access denied: email not allowed" });
        }

        (req as any).user = { email, id: data.user.id };
        next();
      })
      .catch(() => {
        return res.status(401).json({ error: "Invalid or expired token" });
      });
  }

  return { requireAuth };
}
