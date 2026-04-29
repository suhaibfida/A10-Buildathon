import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const startSession = async (req: Request, res: Response) => {
  try {
    // 1. Normalize classId
    const rawClassId = req.params.classId ?? req.body.classId
    const classId = Array.isArray(rawClassId) ? rawClassId[0] : rawClassId

    // 2. Get logged-in user (from auth middleware)
    const userId = req.user?.userId
    const userRole = req.user?.role

    // 3. Validate input
    if (!classId) {
      return res.status(400).json({
        error: "classId is required"
      })
    }

    if (!userId || !userRole) {
      return res.status(401).json({
        error: "Unauthorized"
      })
    }

    // 4. Ensure user is TEACHER
    if (userRole !== "TEACHER") {
      return res.status(403).json({
        error: "Only teachers can start sessions"
      })
    }

    // 5. Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId }
    })

    if (!existingClass) {
      return res.status(404).json({
        error: "Class not found"
      })
    }

    // 6. Ensure teacher is assigned to this class
    if (existingClass.teacherId !== userId) {
      return res.status(403).json({
        error: "You are not assigned to this class"
      })
    }

    // 7. Check if there is already an OPEN session
    const activeSession = await prisma.attendanceSession.findFirst({
      where: {
        classId: classId,
        status: "OPEN"
      }
    })

    if (activeSession) {
      return res.status(400).json({
        error: "A session is already active for this class"
      })
    }

    // 8. Create session
    const session = await prisma.attendanceSession.create({
      data: {
        classId: classId,
        teacherId: userId,
        startTime: new Date(),
        status: "OPEN"
      }
    })

    // 9. Response
    return res.status(201).json({
      message: "Session started successfully",
      data: session
    })

  } catch (error) {
    console.error("Start Session Error:", error)

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}
