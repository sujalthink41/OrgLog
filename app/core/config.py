from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # redis config
    REDIS_HOST: str = Field(...)
    REDIS_PORT: int = Field(...)

    # database url
    DATABASE_URL: str = Field(...)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
