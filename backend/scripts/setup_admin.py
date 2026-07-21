#!/usr/bin/env python3
"""Создаёт роли по умолчанию и первого пользователя панели.

Запуск на сервере:
    python -m scripts.setup_admin --login <логин> --role owner

Пароль скрипт спрашивает интерактивно и нигде не печатает. Повторный запуск
безопасен: существующие роли обновляются, существующий пользователь не трогается.
"""

import argparse
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models import Role, User  # noqa: E402
from app.permissions import DEFAULT_ROLES  # noqa: E402
from app.security import hash_password  # noqa: E402


def sync_roles(db) -> dict[str, Role]:
    roles: dict[str, Role] = {}
    for slug, spec in DEFAULT_ROLES.items():
        role = db.scalar(select(Role).where(Role.slug == slug))
        if role is None:
            role = Role(slug=slug, title=spec["title"], permissions=spec["permissions"], system=spec["system"])
            db.add(role)
            print(f"роль создана: {slug}")
        elif role.system:
            # У владельца всегда полный набор — иначе новое право никому не достанется.
            role.permissions = spec["permissions"]
        roles[slug] = role
    db.commit()
    return roles


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--login", required=True)
    parser.add_argument("--name", default="")
    parser.add_argument("--role", default="owner", choices=list(DEFAULT_ROLES))
    args = parser.parse_args()

    with SessionLocal() as db:
        roles = sync_roles(db)
        if db.scalar(select(User).where(User.login == args.login)):
            print(f"пользователь {args.login} уже существует — пропускаю")
            return 0

        password = getpass.getpass("Пароль (минимум 10 символов): ")
        if len(password) < 10:
            print("слишком короткий пароль", file=sys.stderr)
            return 1
        if password != getpass.getpass("Повторите пароль: "):
            print("пароли не совпадают", file=sys.stderr)
            return 1

        db.add(
            User(
                login=args.login,
                name=args.name or args.login,
                password_hash=hash_password(password),
                role_id=roles[args.role].id,
            )
        )
        db.commit()
        print(f"пользователь {args.login} создан, роль {args.role}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
