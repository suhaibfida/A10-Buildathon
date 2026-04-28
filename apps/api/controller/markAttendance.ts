import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, status } = req.body
    const allowedStatuses = ["PRESENT", "ABSENT", "FLAGGED"] as const

    // 1. Validate input
    if (!sessionId || !userId || !status) {
      return res.status(400).json({
        error: "sessionId, userId and status are required"
      })
    }

    if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      return res.status(400).json({
        error: "Invalid status. Use PRESENT, ABSENT or FLAGGED"
      })
    }

    const normalizedStatus = status as (typeof allowedStatuses)[number]

    // 2. Check session
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return res.status(404).json({
        error: "Session not found"
      })
    }

    if (session.status !== "OPEN") {
      return res.status(400).json({
        error: "Session is not active"
      })
    }

    // 3. Check user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== "STUDENT") {
      return res.status(404).json({
        error: "Student not found"
      })
    }

    // 4. Ensure student belongs to class
    if (user.classId !== session.classId) {
      return res.status(403).json({
        error: "Student does not belong to this class"
      })
    }

    // 5. Create attendance
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        sessionId,
        status: normalizedStatus
      }
    })

    return res.status(201).json({
      message: "Attendance marked",
      data: attendance
    })

  } catch (error: any) {
    console.error("Attendance Error:", error)

    // Handle duplicate marking (unique constraint)
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Attendance already marked for this session"
      })
    }

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}