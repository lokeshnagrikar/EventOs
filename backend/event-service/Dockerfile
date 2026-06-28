# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN sed -i '/<modules>/,/<\/modules>/d' pom.xml
COPY event-service/pom.xml ./event-service/
RUN mvn -f event-service/pom.xml dependency:go-offline -B
COPY event-service/src ./event-service/src
RUN mvn -f event-service/pom.xml package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -g 10001 appgroup && \
    useradd -r -u 10001 -g appgroup appuser

COPY --from=build /app/event-service/target/*.jar app.jar
RUN mkdir -p logs && chown -R appuser:appgroup app.jar logs

EXPOSE 8083
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=240s --retries=10 \
  CMD curl -f http://127.0.0.1:8083/api/v1/events/actuator/health || exit 1

# Development-optimized JVM execution to speed up container startup on local hosts
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-Xmx256m", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
