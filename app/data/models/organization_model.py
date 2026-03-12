from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.data.database.base import Base
from app.data.database.mixins import IdMixin, TableNameMixin, TimestampMixin


class Organization(Base, TableNameMixin, IdMixin, TimestampMixin):

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
