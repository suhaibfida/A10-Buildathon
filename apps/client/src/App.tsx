import { BrowserRouter, Routes, Route } from "react-router-dom"
import AssistantPage from "./pages/AssistantPage"
import AdminDashboard from "./pages/AdminDashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"
import StudentActivate from "./pages/StudentActivate"
import StudentDashboard from "./pages/StudentDashboard"
import TeacherDashboard from "./pages/TeacherDashboard"
import { RequireRole } from "./components/RequireRole"
import { RootRedirect } from "./components/RootRedirect"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/activate" element={<StudentActivate />} />
        <Route
          path="/admin"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/teacher"
          element={
            <RequireRole roles={["TEACHER"]}>
              <TeacherDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/student"
          element={
            <RequireRole roles={["STUDENT"]}>
              <StudentDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/assistant"
          element={
            <RequireRole roles={["ADMIN", "TEACHER", "STUDENT"]}>
              <AssistantPage />
            </RequireRole>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
