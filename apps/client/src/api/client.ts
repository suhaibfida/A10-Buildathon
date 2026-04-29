const API_BASE_URL = "http://localhost:3000/api/v1";

export type ApiResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

export type AuthRole = "ADMIN" | "TEACHER" | "STUDENT";
export type UserStatus = "NOT_REGISTERED" | "ACTIVE" | "BLOCKED";

export type CurrentUser = {
  id: string;
  name: string;
  email?: string | null;
  rollNumber?: string | null;
  role: AuthRole;
  status: UserStatus;
  classId?: string | null;
  departmentId?: string | null;
};

async function apiRequest(method: string, path: string, body?: unknown): Promise<ApiResult> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function apiGet(path: string) {
  return apiRequest("GET", path);
}

export function apiPost(path: string, body: unknown) {
  return apiRequest("POST", path, body);
}

export function apiPatch(path: string, body: unknown) {
  return apiRequest("PATCH", path, body);
}

export const api = {
  me: () => apiGet("/auth/me"),
  register: (body: {
    name: string;
    email: string;
    password: string;
    role: "TEACHER" | "STUDENT";
    rollNumber?: string;
  }) => apiPost("/auth/register", body),
  login: (body: { email: string; password: string }) => apiPost("/auth/login", body),
  activateStudent: (body: { rollNumber: string; password: string }) =>
    apiPost("/students/activate", body),
  listDepartments: () => apiGet("/admin/departments"),
  listClasses: () => apiGet("/admin/classes"),
  listTeachers: () => apiGet("/admin/teachers"),
  listStudents: () => apiGet("/admin/students"),
  createDepartment: (body: { name: string }) => apiPost("/admin/department", body),
  createClass: (body: { name: string; departmentId: string }) => apiPost("/admin/class", body),
  createTeacher: (body: { name: string; email: string; password?: string }) =>
    apiPost("/admin/teachers", body),
  createStudent: (body: {
    name: string;
    rollNumber: string;
    email?: string;
    password?: string;
    classId?: string;
    departmentId?: string;
    status?: UserStatus;
  }) =>
    apiPost("/admin/students", body),
  updateStudentStatus: (studentId: string, body: { status: UserStatus }) =>
    apiPatch(`/admin/students/${studentId}/status`, body),
  addStudentsToClass: (classId: string, body: { studentIds: string[] }) =>
    apiPost(`/admin/class/${classId}/students`, body),
  assignTeacherToClass: (classId: string, body: { teacherId: string }) =>
    apiPost(`/admin/class/${classId}/teacher`, body),
  startSession: (classId: string, body: { durationMinutes: number }) =>
    apiPost(`/teacher/class/${classId}/start-session`, body),
  submitAttendance: (body: { sessionId: string; frames: string[] }) =>
    apiPost("/student/attendance/submit", body),
  markAttendance: (sessionId: string, body: { userId: string; status: string }) =>
    apiPost(`/teacher/session/${sessionId}/attendance`, { ...body, sessionId }),
  endSession: (sessionId: string) => apiPost(`/teacher/session/${sessionId}/end`, {}),
  registerFace: (body: { frames: string[] }) => apiPost("/student/face/register", body),
  faceStatus: () => apiGet("/student/face/status"),
  todayPresent: () => apiGet("/attendance/today/present-count"),
  studentSummary: () => apiGet("/student/attendance/summary"),
  assistant: (body: { question: string }) => apiPost("/assistant/ask", body),
};
