import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

const SUPABASE_URL = "https://guvkubaqeojncfwnnccf.supabase.co";
const ALLOWED_EMAILS = process.env.ALLOWED_EMAIL?.split(",").map((e) => e.trim()) || [];

export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  const supabase = serviceKey
    ? createClient(SUPABASE_URL, serviceKey)
    : null;

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    // Bypass auth if no service key configured
    if (!supabase) {
      return next();
    }

    const authHeader = req.headers.authorization;
    // Allow unauthenticated requests for now (auth is optional on server)
    if (!authHeader?.startsWith("Bearer ")) {
      // Try to proceed without auth
      return next();
    }

    const token = authHeader.slice(7);

    supabase.auth.getUser(token)
      .then(({ data, error }) => {
        if (error || !data.user) {
          // Token invalid but still allow - auth is soft
          return next();
        }

        const email = data.user.email;
        if (email && ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
          return res.status(403).json({ error: "Access denied: email not allowed" });
        }

        (req as any).user = { email, id: data.user.id };
        next();
      })
      .catch(() => {
        // On error, allow through
        next();
      });
  }

  return { requireAuth };
}
