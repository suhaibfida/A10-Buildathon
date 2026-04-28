
import { useState } from "react"
import { Button, Input } from "@repo/ui"
import { useNavigate } from "react-router-dom"
import { registerUser } from "../api/auth"

export const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleRegister = async () => {
    const data = await registerUser(name, email, password)

    if (data.error) {
      alert(data.error)
      return
    }

    alert("Registered successfully")
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-900 p-10 rounded-2xl shadow-xl border border-zinc-800">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Join the AI Attendance System
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Full Name</label>
            <Input
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Email</label>
            <Input
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Button */}
          <div className="pt-2">
            <Button
              onClick={handleRegister}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 transition"
            >
              Register
            </Button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p
            onClick={() => navigate("/")}
            className="text-sm text-blue-400 cursor-pointer hover:underline"
          >
            Already have an account? Login
          </p>
        </div>

      </div>
    </div>
  )
}

export default Register
