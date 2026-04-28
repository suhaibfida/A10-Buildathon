import bcrypt from "bcrypt"
import { prisma } from "../index.js"
import "dotenv/config"

async function main() {
  // 🔹 1. Define admin credentials (we'll improve this later using env)
  const adminEmail = process.env.ADMIN_EMAIL
  
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set")
  }

  // 🔹 2. Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log(" Admin already exists. Skipping seed.")
    return
  }

  // 🔹 3. Hash password (VERY IMPORTANT)
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  // 10 = salt rounds (good balance of security + performance)

  // 🔹 4. Create admin
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "ADMIN", // later we may upgrade to SUPER_ADMIN
      status: "ACTIVE"
    }
  })

  console.log("Admin created successfully")
}

// 🔹 5. Execute script safely
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })