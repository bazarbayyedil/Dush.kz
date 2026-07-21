"""Вход в панель, сессии и проверка прав.

Сессия хранится в базе и передаётся httpOnly-cookie: так её можно отозвать
(блокировка сотрудника выкидывает его немедленно), в отличие от подписанного токена.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error
from fastapi import Cookie, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as DbSession

from .config import get_settings
from .database import get_db
from .models import AuditLog, Session, User, utc_now

COOKIE_NAME = "dush_admin"
SESSION_TTL = timedelta(hours=12)
MAX_ATTEMPTS = 7
LOCKOUT = timedelta(minutes=15)

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        _hasher.verify(password_hash, password)
    except (Argon2Error, ValueError):
        return False
    return True


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def as_utc(value: datetime) -> datetime:
    """SQLite отдаёт время без зоны, PostgreSQL — с зоной. Сравниваем в UTC."""
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def open_session(db: DbSession, user: User, response: Response) -> None:
    token = secrets.token_urlsafe(32)
    db.add(
        Session(
            token_hash=_token_hash(token),
            user_id=user.id,
            expires_at=utc_now() + SESSION_TTL,
        )
    )
    user.last_login_at = utc_now()
    db.commit()
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=get_settings().environment == "production",
        path="/",
    )


def close_session(db: DbSession, token: str | None, response: Response) -> None:
    if token:
        db.execute(delete(Session).where(Session.token_hash == _token_hash(token)))
        db.commit()
    response.delete_cookie(COOKIE_NAME, path="/")


def current_user(
    dush_admin: str | None = Cookie(default=None),
    db: DbSession = Depends(get_db),
) -> User:
    if not dush_admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется вход")
    session = db.get(Session, _token_hash(dush_admin))
    if not session or as_utc(session.expires_at) <= utc_now():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия истекла")
    if not session.user.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Учётная запись заблокирована")
    return session.user


def require(*permissions: str):
    """Зависимость-страж: без права запрос не доходит до обработчика.

    Права проверяются здесь, а не в интерфейсе, — скрытая кнопка не защищает
    от прямого запроса к API.
    """

    def guard(user: User = Depends(current_user)) -> User:
        missing = [p for p in permissions if not user.can(p)]
        if missing:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")
        return user

    return guard


def log_action(
    db: DbSession,
    user: User,
    action: str,
    entity: str,
    entity_id: str | int,
    changes: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user.id,
            user_login=user.login,
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            changes=changes or {},
        )
    )


def purge_expired_sessions(db: DbSession) -> None:
    db.execute(delete(Session).where(Session.expires_at <= utc_now()))
    db.commit()


def user_permissions(user: User) -> list[str]:
    return list(user.role.permissions or [])


def find_user(db: DbSession, login: str) -> User | None:
    return db.scalar(select(User).where(User.login == login))


def is_locked(user: User) -> bool:
    return bool(user.locked_until and as_utc(user.locked_until) > utc_now())


def register_failure(db: DbSession, user: User) -> None:
    """Подбор пароля упирается в паузу: после MAX_ATTEMPTS вход закрыт на LOCKOUT."""
    user.failed_attempts += 1
    if user.failed_attempts >= MAX_ATTEMPTS:
        user.locked_until = utc_now() + LOCKOUT
        user.failed_attempts = 0
    db.commit()


def register_success(db: DbSession, user: User) -> None:
    user.failed_attempts = 0
    user.locked_until = None
