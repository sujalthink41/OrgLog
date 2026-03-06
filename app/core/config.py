from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):

    REDIS_HOST: str = Field(default="localhost", alias="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, alias="REDIS_PORT")

    class Config:
        env_file = ".env"


settings = Settings()
