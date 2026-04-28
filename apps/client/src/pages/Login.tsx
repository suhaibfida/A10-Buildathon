import { useState } from "react"
import axios from "axios"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/auth/login",
        { email, password },
        { withCredentials: true }
      )

      console.log("SUCCESS:", res.data)
    } catch (err) {
      console.log("ERROR:", err)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-6 rounded-xl w-80 space-y-4 text-white shadow-lg">
        
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <input
          className="w-full p-2 rounded bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-500 hover:bg-blue-600 p-2 rounded transition"
          onClick={handleLogin}
        >
          Login
        </button>

      </div>
    </div>
  )
}