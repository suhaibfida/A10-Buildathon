import { createHash } from "crypto"

const EMBEDDING_SIZE = 128

function frameToVector(frame: string) {
  const cleanFrame = frame.includes(",") ? frame.split(",").at(-1) ?? frame : frame
  const bytes = Buffer.from(cleanFrame, "base64")
  const seed = bytes.length > 0 ? bytes : Buffer.from(frame)
  const vector: number[] = []

  for (let index = 0; index < EMBEDDING_SIZE; index++) {
    const hash = createHash("sha256")
      .update(seed)
      .update(String(index))
      .digest()
    const value = hash.readUInt16BE(0) / 65535
    vector.push(Number(value.toFixed(6)))
  }

  return vector
}

export function embeddingFromInput(input: unknown) {
  if (Array.isArray(input) && input.every((value) => typeof value === "number")) {
    return input
  }

  if (!Array.isArray(input) || !input.every((value) => typeof value === "string")) {
    return null
  }

  const frames = input.filter((frame) => frame.trim().length > 0)
  if (frames.length === 0) {
    return null
  }

  const vectors = frames.map(frameToVector)
  return Array.from({ length: EMBEDDING_SIZE }, (_unused, index) => {
    const total = vectors.reduce((sum, vector) => sum + (vector[index] ?? 0), 0)
    return Number((total / vectors.length).toFixed(6))
  })
}

export function isValidEmbedding(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === EMBEDDING_SIZE &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  )
}
