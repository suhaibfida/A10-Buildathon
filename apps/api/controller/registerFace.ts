// src/modules/face/registerFace.ts

import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const registerFace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const role = req.user?.role
    const { embedding } = req.body

    // 1. Auth check
    if (!userId || !role) {
      return res.status(401).json({
        error: "Unauthorized"
      })
    }

    // 2. Only STUDENTS allowed
    if (role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can register face"
      })
    }

    // 3. Validate embedding
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({
        error: "Embedding array is required"
      })
    }

    if (!embedding.every(v => typeof v === "number")) {
      return res.status(400).json({
        error: "Embedding must be numbers only"
      })
    }

    // Optional: enforce embedding size (face-api.js → 128)
    if (embedding.length !== 128) {
      return res.status(400).json({
        error: "Invalid embedding size"
      })
    }

    // 4. Limit embeddings per user (max 5)
    const existingCount = await prisma.faceEmbedding.count({
      where: { userId }
    })

    if (existingCount >= 5) {
      return res.status(400).json({
        error: "Maximum face data already registered (limit: 5)"
      })
    }

    // 5. Store embedding
    const face = await prisma.faceEmbedding.create({
      data: {
        userId,
        vector: embedding
      }
    })

    return res.status(201).json({
      message: "Face registered successfully",
      data: face
    })

  } catch (error) {
    console.error("Register Face Error:", error)

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}