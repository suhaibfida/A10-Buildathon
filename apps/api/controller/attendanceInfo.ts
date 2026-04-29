import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export const todayPresentCount = async (_req: Request, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        status: "PRESENT",
        createdAt: {
          gte: startOfToday(),
        },
      },
      select: { userId: true },
    })

    return res.status(200).json({
      presentToday: new Set(attendances.map((attendance) => attendance.userId)).size,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const studentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, role: true },
    })

    if (!user || user.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can view this summary" })
    }

    const [total, present] = await Promise.all([
      prisma.attendance.count({ where: { userId } }),
      prisma.attendance.count({ where: { userId, status: "PRESENT" } }),
    ])

    const percentage = total === 0 ? 0 : Math.round((present / total) * 100)

    return res.status(200).json({
      data: {
        percentage,
        status: user.status,
        total,
        present,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const teacherClasses = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: { students: true },
        },
      },
    })

    return res.status(200).json({ data: classes })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const teacherActiveSessionByClass = async (req: Request, res: Response) => {
  try {
    const teacherId = req.userId
    const rawClassId = req.params.classId
    const classId = Array.isArray(rawClassId) ? rawClassId[0] : rawClassId

    if (!teacherId) {
      return res.status(401).json({ error: "Unauthorized" })
    }
    if (!classId) {
      return res.status(400).json({ error: "classId is required" })
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, teacherId: true },
    })

    if (!classRecord) {
      return res.status(404).json({ error: "Class not found" })
    }
    if (classRecord.teacherId !== teacherId) {
      return res.status(403).json({ error: "You are not assigned to this class" })
    }

    const session = await prisma.attendanceSession.findFirst({
      where: { classId, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        classId: true,
        teacherId: true,
        startTime: true,
        status: true,
      },
    })

    return res.status(200).json({ data: session })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const studentActiveSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, classId: true, class: { select: { id: true, name: true } } },
    })

    if (!student || student.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can view active session" })
    }

    if (!student.classId) {
      return res.status(200).json({ data: null, message: "Student is not assigned to a class yet" })
    }

    const session = await prisma.attendanceSession.findFirst({
      where: {
        classId: student.classId,
        status: "OPEN",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        classId: true,
        teacherId: true,
        startTime: true,
        status: true,
      },
    })

    return res.status(200).json({
      data: session,
      class: student.class,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
