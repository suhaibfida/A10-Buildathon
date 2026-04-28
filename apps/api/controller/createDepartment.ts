import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body

    // 1. Basic validation (controller responsibility)
    if (!name) {
      return res.status(400).json({ error: "Name is required" })
    }

    // 2. Check duplicate (business rule)
    const existing = await prisma.department.findFirst({
      where: { name }
    })

    if (existing) {
      return res.status(409).json({
        error: "Department already exists"
      })
    }

    // 3. Create department (correct Prisma syntax)
    const department = await prisma.department.create({
      data: { name }
    })

    res.status(201).json({
      message: "Department created",
      data: department
    })

  } catch (error: any) {
    console.error(error)

    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Department already exists" })
    }

    res.status(500).json({ error: "Internal server error" })
  }
}