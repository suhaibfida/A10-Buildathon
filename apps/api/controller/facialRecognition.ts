import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

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
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export const recognizeFace = async (req: Request, res: Response) => {
  try {
    const { embedding, sessionId } = req.body

    // 1. Validate input
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({
        error: "embedding array is required"
      })
    }

    // 2. Get session
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    })

    if (!session || session.status !== "OPEN") {
      return res.status(400).json({
        error: "Invalid or closed session"
      })
    }

    // 3. Get embeddings of students in that class
    const students = await prisma.user.findMany({
      where: {
        classId: session.classId
      },
      include: {
        faceEmbeddings: true
      }
    })

    let bestMatchUserId: string | null = null
    let bestScore = -1

    // 4. Compare with all embeddings
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

    // 5. Threshold check
    const THRESHOLD = 0.8

    if (bestScore < THRESHOLD || !bestMatchUserId) {
      return res.status(404).json({
        error: "No matching face found",
        confidence: bestScore
      })
    }

    // 6. Mark attendance
    const attendance = await prisma.attendance.create({
      data: {
        userId: bestMatchUserId,
        sessionId: sessionId,
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