from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dush.db"
    admin_token: str = ""
    media_base_url: str = "/media"
    environment: str = "development"

    # Платёжный провайдер. Секрет живёт только в /etc/dush.kz/backend.env.
    payments_enabled: bool = False
    tiptop_public_id: str = ""
    tiptop_api_secret: str = ""
    tiptop_api_url: str = "https://api.tiptoppay.kz"

    # Уведомления о заявках. Токен и чат — только в backend.env, не в коде.
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    @property
    def payments_ready(self) -> bool:
        return self.payments_enabled and bool(self.tiptop_public_id and self.tiptop_api_secret)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
