import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const SUPABASE_URL = "https://guvkubaqeojncfwnnccf.supabase.co";
const ALLOWED_EMAILS = process.env.ALLOWED_EMAIL?.split(",").map((e) => e.trim()) || [];

export function createServerClient() {
  // Use Supabase's JWT secret: the service_role key
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    console.warn("SUPABASE_JWT_SECRET not set — auth will be disabled");
  }

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    // Skip auth if no secret configured (dev mode)
    if (!jwtSecret) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
        audience: "authenticated"
      }) as jwt.JwtPayload;

      const email = decoded.email as string | undefined;
      if (!email) {
        return res.status(401).json({ error: "Invalid token: no email" });
      }

      // If ALLOWED_EMAILS is configured, restrict access
      if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
        return res.status(403).json({ error: "Access denied: email not allowed" });
      }

      // Store user info for downstream use
      (req as any).user = { email, id: decoded.sub };
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  return { requireAuth };
}
