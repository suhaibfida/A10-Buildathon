import { useState } from "react"
import { Button, Input } from "@repo/ui"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../api/auth"

export const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email || !password) return

    setLoading(true)
    const data = await loginUser(email, password)
    setLoading(false)

    if (data.error) {
      alert(data.error)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-900 p-10 rounded-2xl shadow-xl border border-zinc-800">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Login to continue
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">

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
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p
            onClick={() => navigate("/register")}
            className="text-sm text-blue-400 cursor-pointer hover:underline"
          >
            Don’t have an account? Register
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login