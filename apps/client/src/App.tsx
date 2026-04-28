import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Register } from "./pages/register.tsx"
import { Login} from "./pages/Login.tsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
       
      </Routes>
    </BrowserRouter>
  )
}

export default App
