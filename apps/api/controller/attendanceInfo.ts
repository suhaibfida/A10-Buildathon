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
