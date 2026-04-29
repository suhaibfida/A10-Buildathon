import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import {
  FaceEmbeddingError,
  embeddingFromInput,
  isFaceApiConfigured,
  isValidEmbedding,
} from "./faceEmbedding.js"

export const registerFace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId || !role) {
      return res.status(401).json({
        error: "Unauthorized"
      })
    }

    if (role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can register face"
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    })

    if (!user || user.status !== "ACTIVE") {
      return res.status(403).json({
        error: "Student account is not active"
      })
    }

    const faceInput = req.body.embedding ?? req.body.frames
    const embedding = await embeddingFromInput(faceInput)

    if (!embedding) {
      if (Array.isArray(req.body.frames) && req.body.frames.length > 0 && !isFaceApiConfigured()) {
        return res.status(503).json({
          error: "face-api.js model files are not configured on the backend"
        })
      }

      return res.status(400).json({
        error: "Embedding array or camera frames are required"
      })
    }

    if (!isValidEmbedding(embedding)) {
      return res.status(400).json({
        error: "Invalid embedding size"
      })
    }

    const existingCount = await prisma.faceEmbedding.count({
      where: { userId }
    })

    if (existingCount >= 1) {
      return res.status(400).json({
        error: "Face is already registered for this account"
      })
    }

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

    if (error instanceof FaceEmbeddingError) {
      return res.status(error.statusCode).json({
        error: error.message
      })
    }

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}

export const faceRegistrationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId || role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can check face registration status"
      })
    }

    const count = await prisma.faceEmbedding.count({
      where: { userId }
    })

    return res.status(200).json({
      registered: count > 0,
      count
    })
  } catch (error) {
    console.error("Face Status Error:", error)

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}
