from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mimi Python Service"
    database_url: str = "postgresql+psycopg://postgres:postgres@postgres:54322/mimi_python"
    internal_api_token: str = "change-me"
    default_page_size: int = 20
    max_page_size: int = 50

    model_config = SettingsConfigDict(env_prefix="MIMI_", extra="ignore")


settings = Settings()
