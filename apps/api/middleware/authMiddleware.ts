import jwt,{ JwtPayload } from "jsonwebtoken"

import { Request, Response, NextFunction } from "express"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      userId?: string
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    res.status(500).json({ error: "JWT_SECRET is not set" })
    return
  }

  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    if (!decoded?.userId) {
      res.status(401).json({ error: "Invalid token payload" })
      return
    }

    req.user = decoded
    req.userId = decoded.userId
    next()
  } catch (err) {
    const message = err instanceof jwt.TokenExpiredError
      ? "Token expired"
      : "Invalid token"
    res.status(401).json({ error: message })
  }
}