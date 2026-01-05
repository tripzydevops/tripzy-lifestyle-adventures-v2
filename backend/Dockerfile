# Use official lightweight Python image
# We use 3.11 as it is stable and widely supported
FROM python:3.11-slim

# Allow statements and log messages to immediately appear in the logs
ENV PYTHONUNBUFFERED True

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the content of the local src directory to the working directory
COPY . .

# Run the web service on container startup using uvicorn
# Cloud Run expects the app to listen on the PORT environment variable (default 8080)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
