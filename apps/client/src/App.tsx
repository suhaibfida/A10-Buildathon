import { BrowserRouter, Routes, Route } from "react-router-dom"
import Signup  from "./pages/register.tsx"
import  Login from "./pages/Login.tsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
       
      </Routes>
    </BrowserRouter>
  )
}

export default App
