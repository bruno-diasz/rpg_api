from datetime import datetime

from data import quests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import (
    AcceptQuestRequest,
    AcceptQuestResponse,
    CompleteQuestResponse,
    Quest,
    QuestListResponse,
)

app = FastAPI(title="Quest Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "http://localhost:8002"


def quest_to_response(q: dict) -> Quest:
    return Quest(
        id=q["id"],
        title=q["title"],
        description=q["description"],
        difficulty=q["difficulty"],
        difficulty_color=q["difficulty_color"],
        reward_xp=q["reward_xp"],
        reward_gold=q["reward_gold"],
        status=q["status"],
        hero_id=q["hero_id"],
        accepted_at=q["accepted_at"],
        completed_at=q["completed_at"],
        icon=q["icon"],
        links={
            "self": f"{BASE_URL}/quests/{q['id']}",
            "accept": f"{BASE_URL}/quests/{q['id']}/accept"
            if q["status"] == "available"
            else None,
            "complete": f"{BASE_URL}/quests/{q['id']}/complete"
            if q["status"] == "in_progress"
            else None,
        },
    )


@app.get("/quests", response_model=QuestListResponse)
def list_quests():
    return QuestListResponse(
        quests=[quest_to_response(q) for q in list(quests.values())],
        links={
            "self": f"{BASE_URL}/quests",
            "available": f"{BASE_URL}/quests?status=available",
            "in_progress": f"{BASE_URL}/quests?status=in_progress",
            "completed": f"{BASE_URL}/quests?status=completed",
        },
    )


@app.get("/quests/{quest_id}", response_model=Quest)
def get_quest(quest_id: str):
    quest = quests.get(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest_to_response(quest)


@app.post("/quests/{quest_id}/accept", response_model=AcceptQuestResponse)
def accept_quest(quest_id: str, body: AcceptQuestRequest):
    quest = quests.get(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest["status"] != "available":
        raise HTTPException(
            status_code=400, detail=f"Quest is already {quest['status']}"
        )

    quest["status"] = "in_progress"
    quest["hero_id"] = body.hero_id
    quest["accepted_at"] = datetime.now().isoformat()

    return AcceptQuestResponse(
        quest_id=quest_id,
        hero_id=body.hero_id,
        status="in_progress",
        message=f"Missão '{quest['title']}' aceita com sucesso!",
        links={
            "self": f"{BASE_URL}/quests/{quest_id}/accept",
            "quest": f"{BASE_URL}/quests/{quest_id}",
            "complete": f"{BASE_URL}/quests/{quest_id}/complete",
        },
    )


@app.post("/quests/{quest_id}/complete", response_model=CompleteQuestResponse)
def complete_quest(quest_id: str):
    quest = quests.get(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Quest is not in progress")

    quest["status"] = "completed"
    quest["completed_at"] = datetime.now().isoformat()

    return CompleteQuestResponse(
        quest_id=quest_id,
        hero_id=quest["hero_id"],
        status="completed",
        reward_xp=quest["reward_xp"],
        reward_gold=quest["reward_gold"],
        message=f"Missão '{quest['title']}' concluída! Recompensas coletadas.",
        links={
            "self": f"{BASE_URL}/quests/{quest_id}/complete",
            "quest": f"{BASE_URL}/quests/{quest_id}",
            "all_quests": f"{BASE_URL}/quests",
        },
    )


@app.get("/")
def root():
    return {
        "service": "Quest Service",
        "version": "1.0.0",
        "links": {
            "quests": f"{BASE_URL}/quests",
            "quest_detail": f"{BASE_URL}/quests/{{quest_id}}",
        },
    }
