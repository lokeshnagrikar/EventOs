# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN sed -i '/<modules>/,/<\/modules>/d' pom.xml
COPY gallery-service/pom.xml ./gallery-service/
RUN mvn -f gallery-service/pom.xml dependency:go-offline -B
COPY gallery-service/src ./gallery-service/src
RUN mvn -f gallery-service/pom.xml package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -g 10001 appgroup && \
    useradd -r -u 10001 -g appgroup appuser

COPY --from=build /app/gallery-service/target/*.jar app.jar
RUN mkdir -p logs && chown -R appuser:appgroup app.jar logs

EXPOSE 8084
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=240s --retries=10 \
  CMD curl -f http://127.0.0.1:8084/api/v1/gallery/actuator/health || exit 1

# Hardened JRE production execution
ENTRYPOINT ["java", "-XX:+UseG1GC", "-Xms256m", "-Xmx512m", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
