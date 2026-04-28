// src/modules/class/class.route.ts

import express, { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"
export const createClass=
  async (req: Request, res: Response) => {
    try {
      const { name, departmentId } = req.body

      // 1. Basic validation
      if (!name || !departmentId) {
        return res.status(400).json({
          error: "Name and departmentId are required"
        })
      }

      // 2. Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      })

      if (!department) {
        return res.status(404).json({
          error: "Department does not exist"
        })
      }

      // 3. Prevent duplicate class in same department
      const existingClass = await prisma.class.findFirst({
        where: {
          name,
          departmentId
        }
      })

      if (existingClass) {
        return res.status(409).json({
          error: "Class already exists in this department"
        })
      }

      // 4. Create class
      const newClass = await prisma.class.create({
        data: {
          name,
          departmentId
        }
      })

      // 5. Response
      return res.status(201).json({
        message: "Class created successfully",
        data: newClass
      })

    } catch (error) {
      console.error(error)
      return res.status(500).json({
        error: "Internal server error"
      })
    }
  }
