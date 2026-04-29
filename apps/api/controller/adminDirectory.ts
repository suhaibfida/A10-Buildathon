import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
import bcrypt from "bcrypt"

const userSelect = {
  id: true,
  name: true,
  email: true,
  rollNumber: true,
  role: true,
  status: true,
  classId: true,
  departmentId: true,
  createdAt: true,
} as const

const studentStatuses = ["NOT_REGISTERED", "ACTIVE", "BLOCKED"] as const

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function isStudentStatus(value: unknown): value is (typeof studentStatuses)[number] {
  return typeof value === "string" && studentStatuses.includes(value as (typeof studentStatuses)[number])
}

export const listDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { classes: true, users: true },
        },
      },
    })

    return res.status(200).json({ data: departments })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const listClasses = async (_req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
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

export const listTeachers = async (_req: Request, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "desc" },
      select: userSelect,
    })

    return res.status(200).json({ data: teachers })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const listStudents = async (_req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      select: userSelect,
    })

    return res.status(200).json({ data: students })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const name = normalizeOptionalString(req.body.name)
    const email = normalizeOptionalString(req.body.email)
    const password = normalizeOptionalString(req.body.password)

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "TEACHER",
        status: "ACTIVE",
      },
      select: userSelect,
    })

    return res.status(201).json({ message: "Teacher created", data: teacher })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const createStudent = async (req: Request, res: Response) => {
  try {
    const name = normalizeOptionalString(req.body.name)
    const rollNumber = normalizeOptionalString(req.body.rollNumber)
    const email = normalizeOptionalString(req.body.email)
    const classId = normalizeOptionalString(req.body.classId)
    const departmentId = normalizeOptionalString(req.body.departmentId)
    const password = normalizeOptionalString(req.body.password)
    const status = isStudentStatus(req.body.status) ? req.body.status : "NOT_REGISTERED"

    if (!name || !rollNumber) {
      return res.status(400).json({ error: "name and rollNumber are required" })
    }

    const existingRollNumber = await prisma.user.findUnique({ where: { rollNumber } })
    if (existingRollNumber) {
      return res.status(409).json({ error: "Roll number already exists" })
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" })
      }
    }

    if (classId) {
      const existingClass = await prisma.class.findUnique({ where: { id: classId } })
      if (!existingClass) {
        return res.status(404).json({ error: "Class not found" })
      }
    }

    if (departmentId) {
      const existingDepartment = await prisma.department.findUnique({ where: { id: departmentId } })
      if (!existingDepartment) {
        return res.status(404).json({ error: "Department not found" })
      }
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null
    const student = await prisma.user.create({
      data: {
        name,
        email: email ?? null,
        rollNumber,
        passwordHash,
        role: "STUDENT",
        status,
        classId: classId ?? null,
        departmentId: departmentId ?? null,
      },
      select: userSelect,
    })

    return res.status(201).json({ message: "Student created", data: student })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const updateStudentStatus = async (req: Request, res: Response) => {
  try {
    const rawStudentId = req.params.studentId
    const studentId = Array.isArray(rawStudentId) ? rawStudentId[0] : rawStudentId
    const { status } = req.body

    if (!studentId || !isStudentStatus(status)) {
      return res.status(400).json({ error: "studentId and valid status are required" })
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } })
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ error: "User is not a student" })
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { status },
      select: userSelect,
    })

    return res.status(200).json({ message: "Student status updated", data: updatedStudent })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
