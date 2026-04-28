import {z} from "zod"
export const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["TEACHER", "STUDENT"]),
    rollNumber: z.string().optional(),
  }).refine((data) => {
    if (data.role === "STUDENT" && !data.rollNumber) {
      return false
    }
    return true
  }, {
    message: "rollNumber is required for students",
    path: ["rollNumber"]
  })
  export const loginSchema = z.object({
    email: z
      .string()
      .email("Invalid email format")
      .min(1, "Email is required"),
  
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
  })
  export const createClassSchema = z.object({
    name: z.string().min(2),
    departmentId: z.string().uuid(),
    teacherId: z.string().uuid().optional(),
  })
  export const createSessionSchema = z.object({
    classId: z.string().uuid(),
    teacherId: z.string().uuid(),
    startTime: z.string().datetime(),
  })