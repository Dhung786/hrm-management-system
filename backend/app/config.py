from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/hr_management"
    secret_key: str = "change-this-secret"
    access_token_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


settings = Settings()
