import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import { clearBleSession } from "./bleSession.js"

export const endSession = async (req: Request, res: Response) => {
  try {
    const rawSessionId = req.params.sessionId
    const sessionId = Array.isArray(rawSessionId)
      ? rawSessionId[0]
      : rawSessionId

    const userId = req.user?.userId
    const role = req.user?.role

    // 1. Validate auth
    if (!userId || role !== "TEACHER") {
      return res.status(403).json({
        error: "Only teachers can end session"
      })
    }

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required"
      })
    }

    // 2. Get session
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
        error: "Session already closed"
      })
    }

    // 3. Check ownership
    if (session.teacherId !== userId) {
      return res.status(403).json({
        error: "You are not allowed to end this session"
      })
    }

    // 4. Get all students in class
    const students = await prisma.user.findMany({
      where: {
        classId: session.classId,
        role: "STUDENT"
      },
      select: { id: true }
    })

    // 5. Get already marked attendance
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        sessionId: sessionId
      },
      select: { userId: true }
    })

    const markedIds = new Set(existingAttendance.map(a => a.userId))

    // 6. Find absent students
    const absentStudents = students.filter(
      s => !markedIds.has(s.id)
    )

    // 7. Bulk insert ABSENT
    if (absentStudents.length > 0) {
      await prisma.attendance.createMany({
        data: absentStudents.map(s => ({
          userId: s.id,
          sessionId: sessionId,
          status: "ABSENT"
        })),
        skipDuplicates: true
      })
    }

    // 8. Close session
    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        endTime: new Date()
      }
    })
    clearBleSession(sessionId)

    return res.status(200).json({
      message: "Session ended successfully",
      absentCount: absentStudents.length,
      data: updatedSession
    })

  } catch (error) {
    console.error("End Session Error:", error)

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}