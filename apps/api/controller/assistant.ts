import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const askAssistant = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    const question = typeof req.body.question === "string" ? req.body.question.trim() : ""

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!question) {
      return res.status(400).json({ error: "question is required" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true,
        status: true,
        attendancePercentage: true,
        class: { select: { name: true } },
        department: { select: { name: true } },
      },
    })

    return res.status(200).json({
      answer: "Assistant backend is connected. Full AI/RAG can be plugged in here.",
      question,
      context: user,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
