import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Quest Board — API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HERO_SERVICE = "http://localhost:8001"
QUEST_SERVICE = "http://localhost:8002"
GATEWAY_URL = "http://localhost:8000"


def hateoas_envelope(data: dict, path: str) -> dict:
    """Wrap response with gateway-level HATEOAS links."""
    return {
        "data": data,
        "_gateway": {
            "service_routed": path,
            "links": {
                "self": f"{GATEWAY_URL}{path}",
                "hero": f"{GATEWAY_URL}/api/heroes/1",
                "quests": f"{GATEWAY_URL}/api/quests",
            },
        },
    }


async def forward(
    method: str, url: str, path: str, body: dict | None = None
) -> JSONResponse:
    async with httpx.AsyncClient() as client:
        try:
            if method == "GET":
                resp = await client.get(url, timeout=5.0)
            elif method == "POST":
                resp = await client.post(url, json=body, timeout=5.0)
            elif method == "PATCH":
                resp = await client.patch(url, json=body, timeout=5.0)
            else:
                raise HTTPException(status_code=405, detail="Method not allowed")

            if resp.status_code >= 400:
                return JSONResponse(status_code=resp.status_code, content=resp.json())

            return JSONResponse(
                status_code=resp.status_code,
                content=hateoas_envelope(resp.json(), path),
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail=f"Service unavailable: {url}")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Service timeout")


# ── Hero routes ──────────────────────────────────────────────


@app.get("/api/heroes/{hero_id}")
async def get_hero(hero_id: str):
    return await forward(
        "GET", f"{HERO_SERVICE}/heroes/{hero_id}", f"/api/heroes/{hero_id}"
    )


@app.get("/api/heroes/{hero_id}/stats")
async def get_hero_stats(hero_id: str):
    return await forward(
        "GET", f"{HERO_SERVICE}/heroes/{hero_id}/stats", f"/api/heroes/{hero_id}/stats"
    )


@app.patch("/api/heroes/{hero_id}/xp")
async def add_xp(hero_id: str, request: Request):
    body = await request.json()
    return await forward(
        "PATCH",
        f"{HERO_SERVICE}/heroes/{hero_id}/xp",
        f"/api/heroes/{hero_id}/xp",
        body,
    )


# ── Quest routes ─────────────────────────────────────────────


@app.get("/api/quests")
async def list_quests(status: str = None):
    url = f"{QUEST_SERVICE}/quests"
    if status:
        url += f"?status={status}"
    return await forward("GET", url, "/api/quests")


@app.get("/api/quests/{quest_id}")
async def get_quest(quest_id: str):
    return await forward(
        "GET", f"{QUEST_SERVICE}/quests/{quest_id}", f"/api/quests/{quest_id}"
    )


@app.post("/api/quests/{quest_id}/accept")
async def accept_quest(quest_id: str, request: Request):
    body = await request.json()
    return await forward(
        "POST",
        f"{QUEST_SERVICE}/quests/{quest_id}/accept",
        f"/api/quests/{quest_id}/accept",
        body,
    )


@app.post("/api/quests/{quest_id}/complete")
async def complete_quest(quest_id: str):
    return await forward(
        "POST",
        f"{QUEST_SERVICE}/quests/{quest_id}/complete",
        f"/api/quests/{quest_id}/complete",
    )


# ── Root ─────────────────────────────────────────────────────


@app.get("/")
def root():
    return {
        "service": "API Gateway",
        "version": "1.0.0",
        "routes": {
            "hero": f"{GATEWAY_URL}/api/heroes/{{hero_id}}",
            "hero_stats": f"{GATEWAY_URL}/api/heroes/{{hero_id}}/stats",
            "hero_xp": f"{GATEWAY_URL}/api/heroes/{{hero_id}}/xp",
            "quests": f"{GATEWAY_URL}/api/quests",
            "quest_detail": f"{GATEWAY_URL}/api/quests/{{quest_id}}",
            "accept_quest": f"{GATEWAY_URL}/api/quests/{{quest_id}}/accept",
            "complete_quest": f"{GATEWAY_URL}/api/quests/{{quest_id}}/complete",
        },
    }
