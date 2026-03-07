from typing import Literal

from pydantic.alias_generators import to_snake

DATABASE_SCHEMA_OBJECTS = Literal["table", "index", "constraint", "pk", "fk", "enum"]


def _pluralize(word: str) -> str:
    if word.endswith("y") and word[-2] not in "aeiou":
        return word[:-1] + "ies"
    elif word.endswith(("s", "x", "z", "ch", "sh")):
        return word + "es"
    else:
        return word + "s"


def get_database_native_name(name: str, type: DATABASE_SCHEMA_OBJECTS) -> str:
    """
    Utility Function for Getting Database Native Name

    Args:
        name: Name of the model
        type: Type of the database object

    Returns:
        str: Database Native Name
    """

    snake_name = to_snake(name)

    match type:
        case "table":
            table_name = _pluralize(snake_name)
            return f"{table_name}"
        case "index":
            return f"ix_{snake_name}"
        case "constraint":
            return f"ck_{snake_name}"
        case "pk":
            return f"pk_{snake_name}"
        case "fk":
            return f"fk_{snake_name}"
        case "enum":
            return f"enum_{snake_name}"
        case _:
            raise ValueError(f"Invalid type: {type}")


def get_foreign_key(model_name: str, field_name: str = "id") -> str:
    """
    Utility Function for Getting Foreign Key

    Args:
        model_name: Name of the model
        field_name: Name of the field. Defaults to "id"

    Returns:
        str: Foreign Key
    """
    return f"{get_database_native_name(model_name, 'table')}.{field_name}"
