from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # redis config
    REDIS_HOST: str = Field(...)
    REDIS_PORT: int = Field(...)

    # database url
    DATABASE_URL: str = Field(...)

    # jwt config
    JWT_SECRET: str = Field(...)
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # org config
    ORG_NAME: str = Field(default="Think41")
    ORG_DOMAIN: str = Field(default="think41.com")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
