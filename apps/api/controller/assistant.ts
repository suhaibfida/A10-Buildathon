import "../env.js"
import { Request, Response } from "express"
import { prisma } from "@repo/db/prisma"

const ragTypes = ["TEACHER", "DEPARTMENT", "GENERAL"] as const
type RagType = (typeof ragTypes)[number]

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[]
  }
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

const MAX_CHUNK_LENGTH = 1400
const CHUNK_OVERLAP = 180
const MAX_RAG_RESULTS = 5

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function isRagType(value: unknown): value is RagType {
  return typeof value === "string" && ragTypes.includes(value as RagType)
}

function getGeminiApiKey() {
  return process.env.GEN_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
}

function getEmbeddingModel() {
  return process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001"
}

function getGenerationModel() {
  return process.env.GEMINI_GENERATION_MODEL?.trim() || "gemini-2.5-flash"
}

function chunkText(content: string) {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ""

  for (const paragraph of normalized) {
    if (paragraph.length > MAX_CHUNK_LENGTH) {
      if (current) {
        chunks.push(current)
        current = ""
      }

      for (let start = 0; start < paragraph.length; start += MAX_CHUNK_LENGTH - CHUNK_OVERLAP) {
        chunks.push(paragraph.slice(start, start + MAX_CHUNK_LENGTH).trim())
      }
      continue
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph
    if (next.length > MAX_CHUNK_LENGTH) {
      chunks.push(current)
      current = paragraph
    } else {
      current = next
    }
  }

  if (current) {
    chunks.push(current)
  }

  return chunks.filter(Boolean)
}

function vectorFromJson(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length)
  if (length === 0) {
    return 0
  }

  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0
    const rightValue = right[index] ?? 0
    dot += leftValue * rightValue
    leftMagnitude += leftValue * leftValue
    rightMagnitude += rightValue * rightValue
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

async function geminiEmbedding(text: string) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error("GEN_AI_API_KEY or GEMINI_API_KEY is not set")
  }

  const model = getEmbeddingModel()
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text }],
        },
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gemini embedding failed (${response.status}): ${detail}`)
  }

  const data = (await response.json()) as GeminiEmbeddingResponse
  const values = data.embedding?.values
  if (!values?.length) {
    throw new Error("Gemini embedding response did not include vector values")
  }

  return values
}

async function geminiAnswer(prompt: string) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error("GEN_AI_API_KEY or GEMINI_API_KEY is not set")
  }

  const model = getGenerationModel()
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gemini generation failed (${response.status}): ${detail}`)
  }

  const data = (await response.json()) as GeminiGenerateResponse
  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim()

  if (!answer) {
    throw new Error("Gemini generation response did not include answer text")
  }

  return answer
}

function allowedTypesForRole(role: string) {
  if (role === "ADMIN") {
    return [...ragTypes]
  }

  if (role === "TEACHER") {
    return ["GENERAL", "DEPARTMENT", "TEACHER"] as RagType[]
  }

  return ["GENERAL", "DEPARTMENT"] as RagType[]
}

export const listRagDocuments = async (_req: Request, res: Response) => {
  try {
    const documents = await prisma.ragDocument.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
      },
      take: 100,
    })

    return res.status(200).json({
      data: documents.map((document) => ({
        ...document,
        preview: document.content.slice(0, 220),
      })),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const createRagDocument = async (req: Request, res: Response) => {
  try {
    const title = normalizeString(req.body.title)
    const content = normalizeString(req.body.content)
    const type = isRagType(req.body.type) ? req.body.type : "GENERAL"

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" })
    }

    const chunks = chunkText(content)
    if (chunks.length === 0) {
      return res.status(400).json({ error: "content must include searchable text" })
    }

    const embeddedChunks = []
    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index] ?? ""
      const embedding = await geminiEmbedding(chunk)
      embeddedChunks.push({
        title: chunks.length === 1 ? title : `${title} (chunk ${index + 1})`,
        content: chunk,
        embedding,
        type,
      })
    }

    const result = await prisma.ragDocument.createMany({
      data: embeddedChunks,
    })

    return res.status(201).json({
      message: "Knowledge added and embedded",
      chunks: result.count,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return res.status(500).json({ error: message })
  }
}

export const deleteRagDocument = async (req: Request, res: Response) => {
  try {
    const rawDocumentId = req.params.documentId
    const documentId = Array.isArray(rawDocumentId) ? rawDocumentId[0] : rawDocumentId

    if (!documentId) {
      return res.status(400).json({ error: "documentId is required" })
    }

    const result = await prisma.ragDocument.deleteMany({
      where: { id: documentId },
    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Knowledge chunk not found" })
    }

    return res.status(200).json({ message: "Knowledge chunk deleted" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const askAssistant = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    const question = normalizeString(req.body.question)

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!question) {
      return res.status(400).json({ error: "question is required" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true,
        status: true,
        attendancePercentage: true,
        class: { select: { name: true } },
        department: { select: { name: true } },
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const questionEmbedding = await geminiEmbedding(question)
    const documents = await prisma.ragDocument.findMany({
      where: {
        type: {
          in: allowedTypesForRole(user.role),
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        embedding: true,
        type: true,
      },
      take: 500,
    })

    const matches = documents
      .map((document) => ({
        id: document.id,
        title: document.title,
        content: document.content,
        type: document.type,
        score: cosineSimilarity(questionEmbedding, vectorFromJson(document.embedding)),
      }))
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, MAX_RAG_RESULTS)

    if (matches.length === 0) {
      return res.status(200).json({
        answer: "I could not find matching college knowledge for that question yet. Ask an admin to add the relevant information.",
        sources: [],
      })
    }

    const context = matches
      .map(
        (match, index) =>
          `Source ${index + 1}: ${match.title} [${match.type}, similarity ${match.score.toFixed(3)}]\n${match.content}`,
      )
      .join("\n\n")

    const prompt = `You are the college AI assistant for an attendance and college management system.
Answer the user's question using only the supplied college knowledge and the user's profile.
If the supplied knowledge does not answer the question, say that the college knowledge base does not have that information yet.
Keep the answer concise, helpful, and practical.

User profile:
Name: ${user.name}
Role: ${user.role}
Status: ${user.status}
Class: ${user.class?.name ?? "Not assigned"}
Department: ${user.department?.name ?? "Not assigned"}
Attendance percentage: ${user.attendancePercentage}

College knowledge:
${context}

Question:
${question}`

    const answer = await geminiAnswer(prompt)

    return res.status(200).json({
      answer,
      sources: matches.map((match) => ({
        id: match.id,
        title: match.title,
        type: match.type,
        score: Number(match.score.toFixed(4)),
      })),
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return res.status(500).json({ error: message })
  }
}
