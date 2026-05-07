from typing import Optional

from pydantic import BaseModel


class Quest(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    difficulty_color: str
    reward_xp: int
    reward_gold: int
    status: str
    hero_id: Optional[str]
    accepted_at: Optional[str]
    completed_at: Optional[str]
    icon: str
    links: dict


class QuestListResponse(BaseModel):
    quests: list[Quest]
    links: dict


class AcceptQuestRequest(BaseModel):
    hero_id: str


class AcceptQuestResponse(BaseModel):
    quest_id: str
    hero_id: str
    status: str
    message: str
    links: dict


class CompleteQuestResponse(BaseModel):
    quest_id: str
    hero_id: str
    status: str
    reward_xp: int
    reward_gold: int
    message: str
    links: dict
