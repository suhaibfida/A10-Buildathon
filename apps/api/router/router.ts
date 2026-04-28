import { Router } from "express"

import { register, login } from "../controller/register.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { authorizeRoles } from "../controller/authorizeRoles.js"

import { createDepartment } from "../controller/createDepartment.js"
import { createClass } from "../controller/createClass.js"
import { addStudentsToClass } from "../controller/addStudentsToClass.js"
import { assignTeacherToClass } from "../controller/assignTeacher.js"

import { startSession } from "../controller/studentSession.js"
import { markAttendance } from "../controller/markAttendance.js"
import {endSession} from "../controller/endSession.js"
import { registerFace } from "../controller/registerFace.js"

const router: Router = Router()

// Auth
router.post("/auth/register", register)
router.post("/auth/login", login)

// Admin
router.post("/admin/department", authMiddleware, authorizeRoles("ADMIN"), createDepartment)
router.post("/admin/class", authMiddleware, authorizeRoles("ADMIN"), createClass)
router.post("/admin/class/:classId/students", authMiddleware, authorizeRoles("ADMIN"), addStudentsToClass)
router.post("/admin/class/:classId/teacher", authMiddleware, authorizeRoles("ADMIN"), assignTeacherToClass)

// Teacher
router.post("/teacher/class/:classId/start-session", authMiddleware, authorizeRoles("TEACHER"), startSession)
router.post("/teacher/session/:sessionId/attendance", authMiddleware, authorizeRoles("TEACHER"), markAttendance)

// Student
router.post(
  "/student/face/register",
  authMiddleware,
  authorizeRoles("STUDENT", "ADMIN"),
  registerFace
)
// endSession
router.post(
    "/teacher/session/:sessionId/end",
    authMiddleware,
    authorizeRoles("TEACHER"),
    endSession
  )

export default router