import { useState } from "react"
import axios from "axios"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("STUDENT")
  const [rollNumber, setRollNumber] = useState("")

  const handleSignup = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/auth/register",
        {
          name,
          email,
          password,
          role,
          rollNumber: role === "STUDENT" ? rollNumber : undefined,
        },
        { withCredentials: true }
      )

      console.log("SUCCESS:", res.data)

    } catch (err) {
      console.log("ERROR:", err)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-6 rounded-xl w-80 space-y-4 text-white">

        <h1 className="text-2xl font-bold text-center">Signup</h1>

        <input
          className="w-full p-2 rounded bg-gray-800"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-gray-800"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-gray-800"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          className="w-full p-2 rounded bg-gray-800"
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>

        {role === "STUDENT" && (
          <input
            className="w-full p-2 rounded bg-gray-800"
            placeholder="Roll Number"
            onChange={(e) => setRollNumber(e.target.value)}
          />
        )}

        <button
          className="w-full bg-green-500 p-2 rounded"
          onClick={handleSignup}
        >
          Signup
        </button>

      </div>
    </div>
  )
}