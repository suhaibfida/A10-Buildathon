import crypto from "crypto"

const SESSION_DURATION_MS = 5 * 60 * 1000
const TOKEN_ROTATION_MS = 12 * 1000
const TOKEN_ACCEPT_WINDOW_MS = 2 * 60 * 1000

type BleSessionState = {
  sessionId: string
  teacherId: string
  secretKey: string
  startedAt: number
  expiresAt: number
}

const bleSessions = new Map<string, BleSessionState>()

function tokenFor(sessionId: string, bucketTimestamp: number, secretKey: string) {
  return crypto
    .createHash("sha256")
    .update(`${sessionId}:${bucketTimestamp}:${secretKey}`)
    .digest("hex")
}

function nowMs() {
  return Date.now()
}

function currentBucket(timestamp = nowMs()) {
  return Math.floor(timestamp / TOKEN_ROTATION_MS) * TOKEN_ROTATION_MS
}

export function createBleSession(sessionId: string, teacherId: string) {
  const startedAt = nowMs()
  const state: BleSessionState = {
    sessionId,
    teacherId,
    secretKey: crypto.randomBytes(24).toString("hex"),
    startedAt,
    expiresAt: startedAt + SESSION_DURATION_MS,
  }
  bleSessions.set(sessionId, state)
  return state
}

export function clearBleSession(sessionId: string) {
  bleSessions.delete(sessionId)
}

export function getBleSession(sessionId: string) {
  const state = bleSessions.get(sessionId)
  if (!state) {
    return null
  }
  if (nowMs() > state.expiresAt) {
    bleSessions.delete(sessionId)
    return null
  }
  return state
}

export function issueBleToken(sessionId: string) {
  const state = getBleSession(sessionId)
  if (!state) {
    return null
  }

  const bucketTimestamp = currentBucket()
  const token = tokenFor(state.sessionId, bucketTimestamp, state.secretKey)

  return {
    type: "ATTENDANCE" as const,
    sessionId: state.sessionId,
    token,
    issuedAt: bucketTimestamp,
    refreshAfterMs: TOKEN_ROTATION_MS,
    expiresAt: state.expiresAt,
  }
}

export function verifyBleToken(sessionId: string, token: string) {
  const state = getBleSession(sessionId)
  if (!state || !token) {
    return false
  }

  const bucket = currentBucket()
  const maxLookbackBuckets = Math.floor(TOKEN_ACCEPT_WINDOW_MS / TOKEN_ROTATION_MS)
  const validTokens: string[] = []
  for (let i = 0; i <= maxLookbackBuckets; i++) {
    validTokens.push(tokenFor(state.sessionId, bucket - i * TOKEN_ROTATION_MS, state.secretKey))
  }

  return validTokens.some((candidate) => {
    const tokenBuffer = Buffer.from(token)
    const candidateBuffer = Buffer.from(candidate)
    if (tokenBuffer.length !== candidateBuffer.length) {
      return false
    }
    return crypto.timingSafeEqual(tokenBuffer, candidateBuffer)
  })
}
