# Use an official Python runtime as a parent image.
# Using a slim version for a smaller image size.
FROM python:3.11-slim

# Set the working directory in the container.
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# --no-cache-dir: Disables the pip cache, reducing image size.
# --trusted-host pypi.python.org: Can be useful if there are SSL issues with PyPI.
RUN pip install --no-cache-dir --trusted-host pypi.python.org -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make port 5000 available to the world outside this container.
EXPOSE 5000

# Define environment variable for the Gunicorn workers.
# This value will be used if not overridden in docker-compose.yml.
ENV GUNICORN_WORKERS 4

# Run app.py when the container launches using Gunicorn.
# Use shell form for CMD to allow environment variable substitution.
CMD gunicorn -w "$GUNICORN_WORKERS" -b "0.0.0.0:5000" app:app