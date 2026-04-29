import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import { createBleSession, issueBleToken } from "./bleSession.js"

export const teacherBleToken = async (req: Request, res: Response) => {
  try {
    const rawSessionId = req.params.sessionId
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId
    const teacherId = req.user?.userId
    const role = req.user?.role

    if (!teacherId || role !== "TEACHER") {
      return res.status(403).json({ error: "Only teachers can fetch BLE token" })
    }

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" })
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: { id: true, teacherId: true, status: true },
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }
    if (session.teacherId !== teacherId) {
      return res.status(403).json({ error: "You are not allowed to broadcast this session" })
    }
    if (session.status !== "OPEN") {
      return res.status(400).json({ error: "Session is not active" })
    }

    let payload = issueBleToken(session.id)
    if (!payload) {
      createBleSession(session.id, teacherId)
      payload = issueBleToken(session.id)
    }
    if (!payload) {
      return res.status(500).json({ error: "Could not generate BLE token" })
    }

    return res.status(200).json({ data: payload })
  } catch (error) {
    console.error("Teacher BLE token error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
