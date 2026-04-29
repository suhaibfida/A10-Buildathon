import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import bcrypt from "bcrypt"

export const activateStudent = async (req: Request, res: Response) => {
  try {
    const { rollNumber, password } = req.body

    if (!rollNumber || !password) {
      return res.status(400).json({ error: "rollNumber and password are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    const student = await prisma.user.findUnique({
      where: { rollNumber },
    })

    if (!student || student.role !== "STUDENT") {
      return res.status(404).json({ error: "Student not found" })
    }

    if (student.status === "BLOCKED") {
      return res.status(403).json({ error: "Student is blocked" })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const updatedStudent = await prisma.user.update({
      where: { id: student.id },
      data: {
        passwordHash,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        role: true,
        status: true,
        classId: true,
      },
    })

    return res.status(200).json({
      message: "Student account activated",
      user: updatedStudent,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
