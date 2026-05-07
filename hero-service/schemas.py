from pydantic import BaseModel
from typing import Optional


class Stats(BaseModel):
    atk: int
    def_: int
    spd: int
    int_: int

    class Config:
        populate_by_name = True


class Hero(BaseModel):
    id: str
    name: str
    class_: str
    level: int
    avatar: str
    hp: int
    max_hp: int
    mp: int
    max_mp: int
    xp: int
    xp_next: int
    gold: int
    active_quests: list[str]
    completed_quests: list[str]

    class Config:
        populate_by_name = True


class HeroResponse(BaseModel):
    id: str
    name: str
    class_name: str
    level: int
    avatar: str
    hp: int
    max_hp: int
    mp: int
    max_mp: int
    xp: int
    xp_next: int
    gold: int
    active_quests: list[str]
    completed_quests: list[str]
    links: dict


class StatsResponse(BaseModel):
    hero_id: str
    atk: int
    def_: int
    spd: int
    int_: int
    links: dict


class AddXpRequest(BaseModel):
    amount: int


class AddXpResponse(BaseModel):
    hero_id: str
    xp_gained: int
    total_xp: int
    leveled_up: bool
    new_level: Optional[int]
    links: dict
