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
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

COPY --from=build /app/event-service/target/*.jar app.jar
RUN mkdir -p logs && chown -R appuser:appgroup app.jar logs

EXPOSE 8083
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=240s --retries=10 \
  CMD wget -q -O - http://127.0.0.1:8083/api/v1/events/actuator/health || exit 1

# Development-optimized JVM execution to speed up container startup on local hosts
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-Xms64m", "-Xmx192m", "-XX:TieredStopAtLevel=1", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
