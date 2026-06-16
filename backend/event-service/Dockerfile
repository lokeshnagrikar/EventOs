# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY event-service/pom.xml ./event-service/
RUN mvn -pl event-service dependency:go-offline -B
COPY event-service/src ./event-service/src
RUN mvn -pl event-service package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/event-service/target/*.jar app.jar
EXPOSE 8083
# Hardened JRE production execution
ENTRYPOINT ["java", "-XX:+UseG1GC", "-Xms256m", "-Xmx512m", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
