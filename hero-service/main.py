from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data import heroes
from schemas import HeroResponse, StatsResponse, AddXpRequest, AddXpResponse

app = FastAPI(title="Hero Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "http://localhost:8001"


@app.get("/heroes/{hero_id}", response_model=HeroResponse)
def get_hero(hero_id: str):
    hero = heroes.get(hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")

    return HeroResponse(
        id=hero["id"],
        name=hero["name"],
        class_name=hero["class"],
        level=hero["level"],
        avatar=hero["avatar"],
        hp=hero["hp"],
        max_hp=hero["max_hp"],
        mp=hero["mp"],
        max_mp=hero["max_mp"],
        xp=hero["xp"],
        xp_next=hero["xp_next"],
        gold=hero["gold"],
        active_quests=hero["active_quests"],
        completed_quests=hero["completed_quests"],
        links={
            "self": f"{BASE_URL}/heroes/{hero_id}",
            "stats": f"{BASE_URL}/heroes/{hero_id}/stats",
            "add_xp": f"{BASE_URL}/heroes/{hero_id}/xp",
        },
    )


@app.get("/heroes/{hero_id}/stats", response_model=StatsResponse)
def get_hero_stats(hero_id: str):
    hero = heroes.get(hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")

    stats = hero["stats"]
    return StatsResponse(
        hero_id=hero_id,
        atk=stats["atk"],
        def_=stats["def"],
        spd=stats["spd"],
        int_=stats["int"],
        links={
            "self": f"{BASE_URL}/heroes/{hero_id}/stats",
            "hero": f"{BASE_URL}/heroes/{hero_id}",
        },
    )


@app.patch("/heroes/{hero_id}/xp", response_model=AddXpResponse)
def add_xp(hero_id: str, body: AddXpRequest):
    hero = heroes.get(hero_id)
    if not hero:
        raise HTTPException(status_code=404, detail="Hero not found")

    hero["xp"] += body.amount
    leveled_up = False
    new_level = None

    if hero["xp"] >= hero["xp_next"]:
        hero["xp"] -= hero["xp_next"]
        hero["level"] += 1
        hero["xp_next"] = int(hero["xp_next"] * 1.5)
        hero["max_hp"] += 10
        hero["hp"] = hero["max_hp"]
        hero["stats"]["atk"] += 3
        hero["stats"]["def"] += 2
        leveled_up = True
        new_level = hero["level"]

    return AddXpResponse(
        hero_id=hero_id,
        xp_gained=body.amount,
        total_xp=hero["xp"],
        leveled_up=leveled_up,
        new_level=new_level,
        links={
            "self": f"{BASE_URL}/heroes/{hero_id}/xp",
            "hero": f"{BASE_URL}/heroes/{hero_id}",
        },
    )


@app.get("/")
def root():
    return {
        "service": "Hero Service",
        "version": "1.0.0",
        "links": {
            "hero": f"{BASE_URL}/heroes/{{hero_id}}",
            "stats": f"{BASE_URL}/heroes/{{hero_id}}/stats",
        },
    }
