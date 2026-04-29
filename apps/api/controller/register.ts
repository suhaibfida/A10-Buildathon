import {Request,Response} from "express"
import { prisma } from "@repo/db/prisma"
import bcrypt from "bcrypt"
import { registerSchema,loginSchema } from "@repo/zod/zod"
import jwt from "jsonwebtoken"
import "dotenv/config"
export const register= ( async (req:Request, res:Response) => {
    try {
      // 🔹 1. Validate input using Zod
      const result = registerSchema.safeParse(req.body)
  
      if (!result.success) {
        return res.status(400).json({
          error: result.error.flatten(),
        })
      }
  
      const { name, email, password, role, rollNumber } = result.data
  
      // 🔹 2. Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
  
      if (existingUser) {
        return res.status(400).json({
          error: "User already exists",
        })
      }
  
      // 🔹 3. Hash password (never store raw password)
      const hashedPassword = await bcrypt.hash(password, 10)
  
      // 🔹 4. Create user in DB
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role,
          status: role === "STUDENT" ? "NOT_REGISTERED" : "ACTIVE",
  
          // only students will have rollNumber
          rollNumber: role === "STUDENT" ? rollNumber : null,
        },
      })
  
      // 🔹 5. Send response (never send passwordHash)
      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
  
    } catch (error) {
      console.error(error)
  
      return res.status(500).json({
        error: "Internal server error",
      })
    }
  })
//   ---------------------------------------------
export const login=async (req:Request, res:Response) => {
    try {
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        return res.status(500).json({ error: "JWT_SECRET is not set" })
      }

      // 🔹 1. Validate input
      const result = loginSchema.safeParse(req.body)
  
      if (!result.success) {
        return res.status(400).json({
          error: result.error.flatten(),
        })
      }
  
      const { email, password } = result.data
  
      // 🔹 2. Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })
  
      if (!user || !user.passwordHash) {
        return res.status(400).json({
          error: "Invalid credentials",
        })
      }

      if (user.status !== "ACTIVE") {
        return res.status(403).json({
          error: "Account is not active",
        })
      }
  
      // 🔹 3. Compare password
      const isMatch = await bcrypt.compare(password, user.passwordHash)
  
      if (!isMatch) {
        return res.status(400).json({
          error: "Invalid credentials",
        })
      }
  
      // 🔹 4. Create JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: "7d" }
      )
  
      // 🔹 5. Send token in cookie
      res.cookie("token", token, {
        httpOnly: true,       // prevents JS access (security)
        secure: false,        // true in production (https)
        sameSite: "lax",
      })
  
      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
  
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        error: "Internal server error",
      })
    }
  };
  
