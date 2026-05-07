# Quest Board — Microserviços com FastAPI

Sistema de mural de missões estilo RPG demonstrando arquitetura de microserviços com FastAPI, API Gateway e HATEOAS.

## Arquitetura

```
Frontend React (5173)
        ↓
API Gateway — porta 8000
├── /api/heroes/*  →  Hero Service  — porta 8001
└── /api/quests/*  →  Quest Service — porta 8002
```

## Estrutura

```
quest-board/
├── gateway/
│   └── main.py          # Roteamento + envelope HATEOAS
├── hero-service/
│   ├── main.py          # Endpoints do herói
│   ├── schemas.py       # Modelos Pydantic
│   └── data.py          # Dados em memória
├── quest-service/
│   ├── main.py          # Endpoints das missões
│   ├── schemas.py       # Modelos Pydantic
│   └── data.py          # Dados em memória
└── frontend/
    └── src/App.jsx      # Tela única React
```

## Pré-requisitos

```bash
pip install fastapi uvicorn httpx
npm create vite@latest frontend -- --template react  # se ainda não criou
```

## Como rodar (4 terminais)

### Terminal 1 — Hero Service
```bash
cd quest-board/hero-service
uvicorn main:app --port 8001 --reload
```

### Terminal 2 — Quest Service
```bash
cd quest-board/quest-service
uvicorn main:app --port 8002 --reload
```

### Terminal 3 — API Gateway
```bash
cd quest-board/gateway
uvicorn main:app --port 8000 --reload
```

### Terminal 4 — Frontend
```bash
cd quest-board/frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

---

## Endpoints

### Via Gateway (use estes no frontend)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/heroes/1 | Perfil do herói |
| GET | /api/heroes/1/stats | Atributos (ATK, DEF, SPD, INT) |
| PATCH | /api/heroes/1/xp | Adicionar XP |
| GET | /api/quests | Listar missões |
| GET | /api/quests/{id} | Detalhe da missão |
| POST | /api/quests/{id}/accept | Aceitar missão |
| POST | /api/quests/{id}/complete | Concluir missão |

### HATEOAS
Toda resposta do gateway inclui:
```json
{
  "data": { ... },
  "_gateway": {
    "service_routed": "/api/quests",
    "links": {
      "self": "http://localhost:8000/api/quests",
      "hero": "http://localhost:8000/api/heroes/1",
      "quests": "http://localhost:8000/api/quests"
    }
  }
}
```

## Fluxo de jogo
1. Herói vê missões disponíveis no mural
2. Aceita uma missão → status muda para `in_progress`
3. Conclui a missão → status vira `completed` + XP é adicionado ao herói via PATCH
4. Se XP suficiente → herói sobe de nível automaticamente

## API Log (frontend)
O painel direito do frontend exibe todas as requisições em tempo real:
- Método HTTP colorido (GET=azul, POST=verde, PATCH=amarelo)
- Path da rota no gateway
- Status code
- Clique em qualquer entrada para ver o payload completo
