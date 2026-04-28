import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const addStudentsToClass = async (req: Request, res: Response) => {
  try {
    // 1. Normalize classId (handle string | string[])
    const rawClassId = req.params.classId
    const classId = Array.isArray(rawClassId) ? rawClassId[0] : rawClassId

    const { studentIds } = req.body

    // 2. Validate input
    if (!classId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        error: "classId and studentIds[] are required"
      })
    }

    if (studentIds.length === 0) {
      return res.status(400).json({
        error: "studentIds cannot be empty"
      })
    }

    // 3. Remove duplicate IDs (important fix)
    const uniqueStudentIds = [...new Set(studentIds)]

    // 4. Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId }
    })

    if (!existingClass) {
      return res.status(404).json({
        error: "Class not found"
      })
    }

    // 5. Fetch users
    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueStudentIds }
      }
    })

    // 6. Ensure all users exist
    if (users.length !== uniqueStudentIds.length) {
      return res.status(400).json({
        error: "Some users not found"
      })
    }

    // 7. Ensure all are STUDENTS
    const nonStudents = users.filter(user => user.role !== "STUDENT")

    if (nonStudents.length > 0) {
      return res.status(403).json({
        error: "Some users are not students"
      })
    }

    // 8. Prevent reassignment (students in other class)
    const alreadyAssignedElsewhere = users.filter(
      user => user.classId && user.classId !== classId
    )

    if (alreadyAssignedElsewhere.length > 0) {
      return res.status(400).json({
        error: "Some students are already assigned to another class"
      })
    }

    // 9. Check if all already in same class (avoid unnecessary DB write)
    const alreadyInClass = users.every(user => user.classId === classId)

    if (alreadyInClass) {
      return res.status(200).json({
        message: "Students already assigned to this class",
        count: users.length
      })
    }

    // 10. Assign students (bulk update)
    const result = await prisma.user.updateMany({
      where: {
        id: { in: uniqueStudentIds }
      },
      data: {
        classId: classId
      }
    })

    // 11. Success response
    return res.status(200).json({
      message: "Students added successfully",
      updatedCount: result.count
    })

  } catch (error) {
    console.error("Add Students Error:", error)

    return res.status(500).json({
      error: "Internal server error"
    })
  }
}