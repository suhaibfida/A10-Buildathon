#  A10 Attendance System (TurboRepo Monorepo)
<img width="15083" height="6941" alt="imagee" src="https://github.com/user-attachments/assets/51e693fa-a341-4cd0-98de-42b8ff76eb17" />
<img width="1763" height="882" alt="image" src="https://github.com/user-attachments/assets/d271dc38-3d39-43d8-a96e-6243a40a86d1" />
<img width="1681" height="768" alt="image" src="https://github.com/user-attachments/assets/1d7796d9-f805-4f7c-af4c-b177f794d25a" />
<img width="1898" height="923" alt="image" src="https://github.com/user-attachments/assets/7b2379c3-52a1-4e18-a036-09fa1e617cf7" />
<img width="1600" height="825" alt="WhatsApp Image 2026-04-29 at 12 21 47 PM" src="https://github.com/user-attachments/assets/5b9a404e-6a8a-4038-ac36-a326c67eb09a" />
<img width="1600" height="813" alt="WhatsApp Image 2026-04-29 at 12 24 53 PM" src="https://github.com/user-attachments/assets/85015fe9-9778-4d44-abfc-ffbd23fc0cca" />
<img width="1876" height="829" alt="image" src="https://github.com/user-attachments/assets/dab17ec5-2ffc-4892-aee7-ac6ef33a6d7b" />
<img width="1860" height="878" alt="image" src="https://github.com/user-attachments/assets/174c15a4-0111-410c-b5d4-ac798cd281d6" />


An AI-powered attendance platform using **face recognition + BLE proximity + session-based verification**.
Built with a modern **TurboRepo + Bun + TypeScript** stack.

---

## 🧠 Features

* Admin-controlled system (no public signup)
* Teacher session-based attendance (time-bound)
*  Student face recognition (AI embeddings)
*  BLE proximity verification (anti-cheating)
*  Daily attendance analytics
*  AI Assistant (RAG-based queries)
*  Monorepo architecture with TurboRepo

---

## 🏗️ Monorepo Structure

```
.
├── apps/
│   ├── web/            # Frontend (React / Next.js)
│   ├── backend/        # Express API (Bun + TypeScript)
│
├── packages/
│   ├── db/             # Prisma schema + client
│   ├── ui/             # Shared UI components
│   ├── config/         # Shared configs (tsconfig, eslint)
│
├── turbo.json
├── package.json
```

---

## ⚙️ Tech Stack

### 🖥️ Backend

* Bun (runtime)
* TypeScript
* Express.js
* Prisma ORM
* PostgreSQL

### 🤖 AI / ML

* Face Recognition: face-api.js
* Embeddings: 128-d face vectors
* Similarity: Cosine similarity

###  Frontend

* React / Next.js
* Tailwind CSS

### 📡 Proximity

* BLE (Bluetooth Low Energy)
* react-native-ble-plx (mobile)

### 🤖 AI Assistant

* RAG (Retrieval Augmented Generation)
* Gemini / LLM (for queries, not face recognition)

### 🧱 Monorepo

* TurboRepo
* Bun Workspaces

---

## 🚀 Getting Started

### 1️⃣ Clone the repo

```bash
git clone https://github.com/your-username/ai-attendance.git
cd ai-attendance
```

---

### 2️⃣ Install dependencies (Bun)

```bash
bun install
```

---

### 3️⃣ Setup environment variables

Create `.env` in `packages/db`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance"

EMBEDDING_VECTOR_SIZE=128
EMBEDDING_API_URL=
EMBEDDING_API_KEY=
```

---

### 4️⃣ Setup database

```bash
cd packages/db
bun prisma migrate dev --name init
```

---

### 5️⃣ Generate Prisma client

```bash
bun prisma generate
```

---

### 6️⃣ Run development servers

From root:

```bash
bun run dev
```

Turbo will run:

* backend
* frontend

---

## 🤖 Face Recognition Flow

```
Camera → face-api.js → embedding (vector)
        ↓
Compare with stored embeddings
        ↓
Cosine similarity → confidence score
        ↓
Mark attendance
```

---

## 📡 BLE Attendance Flow

```
Teacher starts session
→ BLE broadcast (sessionId + token)

Student scans BLE
→ detects session

Student captures face
→ sends to backend

Backend:
→ validate session
→ validate BLE token
→ match face
→ mark attendance
```

---

## 📊 Attendance Logic

* Session-based (5 minutes)
* One attendance per student per session
* Daily count = unique students marked PRESENT

---

## 🤖 AI Assistant

Supports queries like:

* "What is my attendance?"
* "Who teaches my class?"
* "Show today's attendance stats"

Uses:

* User context (JWT)
* RAG documents
* Database queries

---

## 🔐 Security Design

* No public signup
* Role-based access (Admin / Teacher / Student)
* BLE token rotation (anti-replay)
* Face confidence thresholds
* Session time limits

---

## 📌 Scripts

```bash
bun run dev        # start all apps (turbo)
bun run build      # build all apps
bun run lint       # lint code
```

---

## 🧠 Architecture

```
Frontend → Backend API → AI (face-api)
                        ↓
                    PostgreSQL
                        ↓
                    RAG + AI Assistant
```

---

## ⚠️ Notes

* face-api.js runs locally (no API key required)
* Use good lighting for better accuracy
* BLE works best on mobile apps (not web)

---

## 🚀 Future Improvements

* Switch to  Pinecone for vector databases
* Use GPS [Student present in campus]

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

