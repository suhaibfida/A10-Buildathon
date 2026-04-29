import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import {
  FaceEmbeddingError,
  embeddingFromInput,
  isFaceApiConfigured,
  isValidEmbedding,
} from "./faceEmbedding.js"
import { verifyBleToken } from "./bleSession.js"

const cosineSimilarity = (a: number[], b: number[]) => {
  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    const valA = a[i]
    const valB = b[i]
    if (valA === undefined || valB === undefined) continue
    dot += valA * valB
    normA += valA * valA
    normB += valB * valB
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dot / denominator
}

export const markAttendanceWithBle = async (req: Request, res: Response) => {
  try {
    const { sessionId, token } = req.body
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId || role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can mark attendance" })
    }

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" })
    }

    if (!token || typeof token !== "string" || !verifyBleToken(sessionId, token)) {
      return res.status(403).json({ error: "You are not in classroom" })
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    })
    if (!session || session.status !== "OPEN") {
      return res.status(400).json({ error: "Session is not active" })
    }

    const student = await prisma.user.findUnique({ where: { id: userId } })
    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ error: "Student not found" })
    }
    if (student.status !== "ACTIVE") {
      return res.status(403).json({ error: "Student account is not active" })
    }
    if (student.classId !== session.classId) {
      return res.status(403).json({ error: "Student does not belong to this class" })
    }

    const faceInput = req.body.embedding ?? req.body.frames
    const embedding = await embeddingFromInput(faceInput)

    if (!isValidEmbedding(embedding)) {
      if (Array.isArray(req.body.frames) && req.body.frames.length > 0 && !isFaceApiConfigured()) {
        return res.status(503).json({ error: "face-api.js model files are not configured on the backend" })
      }

      return res.status(400).json({ error: "Camera frames are required" })
    }

    const classmates = await prisma.user.findMany({
      where: { classId: session.classId, role: "STUDENT" },
      include: { faceEmbeddings: true },
    })

    let bestMatchUserId: string | null = null
    let bestScore = -1
    for (const item of classmates) {
      for (const emb of item.faceEmbeddings) {
        const score = cosineSimilarity(embedding, emb.vector as number[])
        if (score > bestScore) {
          bestScore = score
          bestMatchUserId = item.id
        }
      }
    }

    if (bestScore < 0.8 || !bestMatchUserId) {
      return res.status(404).json({ error: "No matching face found", confidence: bestScore })
    }

    if (bestMatchUserId !== userId) {
      return res.status(403).json({
        error: "Submitted face does not match the logged-in student",
        confidence: bestScore,
      })
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: bestMatchUserId,
        sessionId,
        status: "PRESENT",
        confidence: bestScore,
      },
    })

    return res.status(200).json({
      message: "Attendance marked via BLE + face recognition",
      data: attendance,
    })
  } catch (error: any) {
    console.error("BLE Attendance Error:", error)
    if (error instanceof FaceEmbeddingError) {
      return res.status(error.statusCode).json({ error: error.message })
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Attendance already marked" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}
