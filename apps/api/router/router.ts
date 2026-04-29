import { Router } from "express"

import { register, login } from "../controller/register.js"
import { authMe } from "../controller/authMe.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { authorizeRoles } from "../controller/authorizeRoles.js"

import { createDepartment } from "../controller/createDepartment.js"
import { createClass } from "../controller/createClass.js"
import { addStudentsToClass } from "../controller/addStudentsToClass.js"
import { assignTeacherToClass } from "../controller/assignTeacher.js"
import {
  createStudent,
  createTeacher,
  listClasses,
  listDepartments,
  listStudents,
  listTeachers,
  updateStudentStatus,
} from "../controller/adminDirectory.js"

import { startSession } from "../controller/studentSession.js"
import { markAttendance } from "../controller/markAttendance.js"
import {endSession} from "../controller/endSession.js"
import { faceRegistrationStatus, registerFace } from "../controller/registerFace.js"
import { activateStudent } from "../controller/activateStudent.js"
import { recognizeFace } from "../controller/facialRecognition.js"
import { studentAttendanceSummary, todayPresentCount } from "../controller/attendanceInfo.js"
import { askAssistant } from "../controller/assistant.js"

const router: Router = Router()

// Auth
router.post("/auth/register", register)
router.post("/auth/login", login)
router.get("/auth/me", authMiddleware, authMe)

// Admin
router.get("/admin/departments", authMiddleware, authorizeRoles("ADMIN"), listDepartments)
router.get("/admin/classes", authMiddleware, authorizeRoles("ADMIN"), listClasses)
router.get("/admin/teachers", authMiddleware, authorizeRoles("ADMIN"), listTeachers)
router.get("/admin/students", authMiddleware, authorizeRoles("ADMIN"), listStudents)
router.post("/admin/department", authMiddleware, authorizeRoles("ADMIN"), createDepartment)
router.post("/admin/class", authMiddleware, authorizeRoles("ADMIN"), createClass)
router.post("/admin/teachers", authMiddleware, authorizeRoles("ADMIN"), createTeacher)
router.post("/admin/students", authMiddleware, authorizeRoles("ADMIN"), createStudent)
router.patch("/admin/students/:studentId/status", authMiddleware, authorizeRoles("ADMIN"), updateStudentStatus)
router.post("/admin/class/:classId/students", authMiddleware, authorizeRoles("ADMIN"), addStudentsToClass)
router.post("/admin/class/:classId/teacher", authMiddleware, authorizeRoles("ADMIN"), assignTeacherToClass)

// Student activation
router.post("/students/activate", activateStudent)

// Teacher
router.post("/teacher/class/:classId/start-session", authMiddleware, authorizeRoles("TEACHER"), startSession)
router.post("/teacher/session/:sessionId/attendance", authMiddleware, authorizeRoles("TEACHER"), markAttendance)

// Student
router.post(
  "/student/face/register",
  authMiddleware,
  authorizeRoles("STUDENT"),
  registerFace
)
router.get(
  "/student/face/status",
  authMiddleware,
  authorizeRoles("STUDENT"),
  faceRegistrationStatus
)
router.post(
  "/student/attendance/submit",
  authMiddleware,
  authorizeRoles("STUDENT"),
  recognizeFace
)
router.get(
  "/student/attendance/summary",
  authMiddleware,
  authorizeRoles("STUDENT"),
  studentAttendanceSummary
)

// Shared dashboard and assistant
router.get("/attendance/today/present-count", authMiddleware, todayPresentCount)
router.post("/assistant/ask", authMiddleware, askAssistant)
// endSession
router.post(
    "/teacher/session/:sessionId/end",
    authMiddleware,
    authorizeRoles("TEACHER"),
    endSession
  )

export default router
