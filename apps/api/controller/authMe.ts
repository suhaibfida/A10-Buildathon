import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const authMe = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        role: true,
        status: true,
        classId: true,
        departmentId: true,
      },
    })

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    return res.status(200).json({ user })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
