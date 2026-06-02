import type { Request, Response, NextFunction } from "express";

export function authorize(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permissions = req.session?.permissions ?? [];
    if (!permissions.includes(permission)) {
      res.status(403).json({ error: "ليس لديك صلاحية للقيام بهذه العملية" });
      return;
    }
    next();
  };
}
