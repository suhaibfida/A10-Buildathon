import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import { embeddingFromInput, isValidEmbedding } from "./faceEmbedding.js"

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

export const recognizeFace = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    const embedding = embeddingFromInput(req.body.embedding ?? req.body.frames)
    const userId = req.user?.userId
    const role = req.user?.role

    if (!userId || role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can submit attendance frames"
      })
    }

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required"
      })
    }

    if (!isValidEmbedding(embedding)) {
      return res.status(400).json({
        error: "Embedding array or camera frames are required"
      })
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    })

    if (!session || session.status !== "OPEN") {
      return res.status(400).json({
        error: "Invalid or closed session"
      })
    }

    const currentStudent = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!currentStudent || currentStudent.role !== "STUDENT") {
      return res.status(404).json({
        error: "Student not found"
      })
    }

    if (currentStudent.status !== "ACTIVE") {
      return res.status(403).json({
        error: "Student account is not active"
      })
    }

    if (currentStudent.classId !== session.classId) {
      return res.status(403).json({
        error: "Student does not belong to this class"
      })
    }

    const students = await prisma.user.findMany({
      where: {
        classId: session.classId,
        role: "STUDENT"
      },
      include: {
        faceEmbeddings: true
      }
    })

    let bestMatchUserId: string | null = null
    let bestScore = -1

    for (const student of students) {
      for (const emb of student.faceEmbeddings) {
        const storedVector = emb.vector as number[]
        const score = cosineSimilarity(embedding, storedVector)

        if (score > bestScore) {
          bestScore = score
          bestMatchUserId = student.id
        }
      }
    }

    const threshold = 0.8

    if (bestScore < threshold || !bestMatchUserId) {
      return res.status(404).json({
        error: "No matching face found",
        confidence: bestScore
      })
    }

    if (bestMatchUserId !== userId) {
      return res.status(403).json({
        error: "Submitted face does not match the logged-in student",
        confidence: bestScore
      })
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: bestMatchUserId,
        sessionId,
        status: "PRESENT",
        confidence: bestScore
      }
    })

    return res.status(200).json({
      message: "Attendance marked via face recognition",
      userId: bestMatchUserId,
      confidence: bestScore,
      data: attendance
    })

  } catch (error: any) {
    console.error("Face Recognition Error:", error)

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Attendance already marked"
      })
    }

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}
