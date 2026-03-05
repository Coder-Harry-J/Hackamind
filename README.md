# 🛍️ Catalog AI — AI-Powered Product Catalog Organizer

An AI-powered micro-SaaS that automatically clusters uploaded product images into logical product groups using CLIP embeddings and DBSCAN clustering.

---

## 🏗️ Architecture

```
catalog-ai/
├── frontend/        → Next.js (port 3000)
├── backend/         → Node.js + Express (port 5000)
└── ai-service/      → Python FastAPI (port 8000)
```

## 🚀 Quick Start

### 1. AI Service (Python FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 Endpoints

| Service   | Endpoint               | Method | Description                    |
|-----------|------------------------|--------|--------------------------------|
| Backend   | `/upload`              | POST   | Upload product images          |
| Backend   | `/process-images`      | POST   | Trigger AI clustering          |
| Backend   | `/clusters`            | GET    | Get clustered results          |
| AI Service| `/process-images`      | POST   | Generate embeddings & clusters |

---

## 🧠 AI Pipeline

1. Images uploaded → stored by Express backend  
2. Backend calls FastAPI with image paths  
3. FastAPI loads images → generates CLIP embeddings  
4. DBSCAN clusters embeddings by visual similarity  
5. Cluster groups returned as JSON  
6. Frontend renders grouped product clusters  
