import { Request, Response, NextFunction } from "express"

type Role = "ADMIN" | "TEACHER" | "STUDENT"

// This function takes allowed roles
export const authorizeRoles = (...allowedRoles: Role[]) => {

  // And returns middleware
  return (req: Request, res: Response, next: NextFunction): void => {

    // 1. Ensure user exists (auth must run before this)
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }

    // 2. Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden: Access denied"
      })
      return
    }

    // 3. Allow request
    next()
  }
}