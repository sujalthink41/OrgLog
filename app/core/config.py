from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # redis config
    REDIS_HOST: str = Field(...)
    REDIS_PORT: int = Field()

    # postgres config
    POSTGRES_HOST: str = Field(...)
    POSTGRES_PORT: int = Field(...)
    POSTGRES_USER: str = Field(...)
    POSTGRES_PASSWORD: str = Field(...)
    POSTGRES_DB: str = Field(...)

    class Config:
        env_file = ".env"


settings = Settings()
