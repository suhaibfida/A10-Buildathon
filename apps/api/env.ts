import dotenv from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const apiDirectory = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(apiDirectory, ".env"), override: true, quiet: true })
dotenv.config({ quiet: true })
