import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const assignTeacherToClass = async (req: Request, res: Response) => {
  try {
    const classId = req.params.classId as string
    const { teacherId } = req.body

    // 1. Validate input
    if (!classId || !teacherId) {
      return res.status(400).json({
        error: "classId and teacherId are required"
      })
    }

    // 2. Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId }
    })

    if (!existingClass) {
      return res.status(404).json({
        error: "Class not found"
      })
    }

    // 3. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: teacherId }
    })

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }

    // 4. Ensure user is a TEACHER
    if (user.role !== "TEACHER") {
      return res.status(400).json({
        error: "User is not a teacher"
      })
    }

    // 5. Assign teacher
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        teacherId
      }
    })

    return res.status(200).json({
      message: "Teacher assigned successfully",
      data: updatedClass
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}