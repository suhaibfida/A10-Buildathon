import { existsSync } from "fs"
import path from "path"
import * as canvas from "canvas"
import * as faceapi from "face-api.js"

const EMBEDDING_SIZE = Number(process.env.EMBEDDING_VECTOR_SIZE ?? 128)
const FACE_MODEL_DIR = path.resolve(
  process.env.FACE_API_MODEL_DIR ?? process.env.FACE_MODEL_DIR ?? "./models"
)
const FACE_DETECTION_MIN_CONFIDENCE = Number(process.env.FACE_DETECTION_MIN_CONFIDENCE ?? 0.5)
const REQUIRED_MODEL_MANIFESTS = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-weights_manifest.json",
]

const { Canvas, Image, ImageData, loadImage } = canvas

faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as typeof HTMLCanvasElement,
  Image: Image as unknown as typeof HTMLImageElement,
  ImageData: ImageData as unknown as typeof globalThis.ImageData,
})

export class FaceEmbeddingError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = "FaceEmbeddingError"
    this.statusCode = statusCode
  }
}

let modelLoadPromise: Promise<void> | null = null

function normalizeEmbedding(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const vector = value.map((item) => (typeof item === "string" ? Number(item) : item))
  return isValidEmbedding(vector) ? vector : null
}

function averageEmbeddings(vectors: number[][]) {
  return Array.from({ length: EMBEDDING_SIZE }, (_unused, index) => {
    const total = vectors.reduce((sum, vector) => sum + (vector[index] ?? 0), 0)
    return Number((total / vectors.length).toFixed(6))
  })
}

function frameToBuffer(frame: string) {
  const trimmed = frame.trim()
  if (!trimmed) {
    throw new FaceEmbeddingError("Camera frame is empty", 400)
  }

  const base64 = trimmed.includes(",") ? trimmed.split(",").at(-1) : trimmed
  if (!base64) {
    throw new FaceEmbeddingError("Camera frame is invalid", 400)
  }

  return Buffer.from(base64, "base64")
}

async function ensureModelsLoaded() {
  if (!isFaceApiConfigured()) {
    throw new FaceEmbeddingError(
      `Required face-api.js model files were not found in: ${FACE_MODEL_DIR}`,
      503
    )
  }

  modelLoadPromise ??= (async () => {
    try {
      await faceapi.tf.setBackend("cpu")
      await faceapi.tf.ready()
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(FACE_MODEL_DIR)
      await faceapi.nets.faceLandmark68Net.loadFromDisk(FACE_MODEL_DIR)
      await faceapi.nets.faceRecognitionNet.loadFromDisk(FACE_MODEL_DIR)
    } catch (error) {
      modelLoadPromise = null
      throw new FaceEmbeddingError("Could not load face-api.js models from disk", 503)
    }
  })()

  return modelLoadPromise
}

async function embeddingFromFrame(frame: string) {
  await ensureModelsLoaded()

  const image = await loadImage(frameToBuffer(frame))
  const result = await faceapi
    .detectSingleFace(
      image as unknown as faceapi.TNetInput,
      new faceapi.SsdMobilenetv1Options({ minConfidence: FACE_DETECTION_MIN_CONFIDENCE })
    )
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!result) {
    throw new FaceEmbeddingError("No face detected in camera frame", 422)
  }

  return Array.from(result.descriptor, (value) => Number(value.toFixed(6)))
}

export async function embeddingFromInput(input: unknown) {
  const directEmbedding = normalizeEmbedding(input)
  if (directEmbedding) {
    return directEmbedding
  }

  if (typeof input === "string") {
    return embeddingFromFrame(input)
  }

  if (!Array.isArray(input) || !input.every((value) => typeof value === "string")) {
    return null
  }

  const frames = input.filter((frame) => frame.trim().length > 0)
  if (frames.length === 0) {
    return null
  }

  const embeddings = await Promise.all(frames.map((frame) => embeddingFromFrame(frame)))
  return averageEmbeddings(embeddings)
}

export function isFaceApiConfigured() {
  return (
    existsSync(FACE_MODEL_DIR) &&
    REQUIRED_MODEL_MANIFESTS.every((fileName) => existsSync(path.join(FACE_MODEL_DIR, fileName)))
  )
}

export function isValidEmbedding(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === EMBEDDING_SIZE &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  )
}
