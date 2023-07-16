FROM ubuntu:latest

RUN apt-get update && \
    apt-get install -y time g++ openjdk-11-jdk python3.9

WORKDIR /app

# Keep the container running indefinitely
CMD tail -f /dev/null