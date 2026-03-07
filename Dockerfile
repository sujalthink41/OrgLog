# Start from python base image
FROM python:3.12-slim 

# set working directory inside the container
WORKDIR /app 

# Install Poetry - a Python dependency management tool
RUN pip install poetry 

# Copy dependency files first (for Docker layer caching -
# this means if your code changes but dependencies don't,
# Docker reuses the cached dependency layer = faster builds)
COPY pyproject.toml poetry.lock* ./

# Install dependencies (--no-root means don't install your project as a package,
# --no-dev means skip dev dependencies like black/isort in production)
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction

# Now copy my actual code 
COPY . .

# Tell Docker this container listens on port 8000
EXPOSE 8000

# Default command: run the API server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]