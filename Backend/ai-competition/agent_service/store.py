import asyncio
from models import AgentProfile, ChatSession, ChatMessage
from typing import Optional


class AgentStore:
    _profiles: dict[str, AgentProfile] = {}

    @classmethod
    def save_profile(cls, profile: AgentProfile) -> None:
        cls._profiles[profile.agent_id] = profile

    @classmethod
    def get_profile(cls, agent_id: str) -> Optional[AgentProfile]:
        return cls._profiles.get(agent_id)

    @classmethod
    def exists(cls, agent_id: str) -> bool:
        return agent_id in cls._profiles


class ChatStore:
    _sessions: dict[str, ChatSession] = {}
    _listeners: dict[str, list[asyncio.Queue]] = {}

    @classmethod
    def create_session(cls, session: ChatSession) -> None:
        cls._sessions[session.session_id] = session
        cls._listeners[session.session_id] = []

    @classmethod
    def get_session(cls, session_id: str) -> Optional[ChatSession]:
        return cls._sessions.get(session_id)

    @classmethod
    def append_message(cls, session_id: str, message: ChatMessage) -> None:
        session = cls._sessions.get(session_id)
        if session:
            session.messages.append(message)
        for q in cls._listeners.get(session_id, []):
            q.put_nowait({"event": "message", "data": message.model_dump()})

    @classmethod
    def subscribe(cls, session_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        cls._listeners.setdefault(session_id, []).append(q)
        return q

    @classmethod
    def notify_done(cls, session_id: str, data: dict) -> None:
        for q in cls._listeners.get(session_id, []):
            q.put_nowait({"event": "done", "data": data})

    @classmethod
    def unsubscribe(cls, session_id: str, q: asyncio.Queue) -> None:
        listeners = cls._listeners.get(session_id, [])
        if q in listeners:
            listeners.remove(q)

    @classmethod
    def get_messages(cls, session_id: str) -> list[ChatMessage]:
        session = cls._sessions.get(session_id)
        return session.messages if session else []

    @classmethod
    def get_messages_since(cls, session_id: str, since_id: str) -> list[ChatMessage]:
        session = cls._sessions.get(session_id)
        if not session:
            return []
        found = False
        result = []
        for msg in session.messages:
            if found:
                result.append(msg)
            elif msg.id == since_id:
                found = True
        return result

    @classmethod
    def update_status(cls, session_id: str, status: str) -> None:
        session = cls._sessions.get(session_id)
        if session:
            session.status = status
