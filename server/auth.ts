import type { Request, Response, NextFunction } from "express";

export function createServerClient() {
  function requireAuth(_req: Request, _res: Response, next: NextFunction) {
    // Auth is handled client-side via Supabase Google sign-in
    // Server trusts the client — email whitelist enforced in Auth.tsx
    next();
  }

  return { requireAuth };
}
