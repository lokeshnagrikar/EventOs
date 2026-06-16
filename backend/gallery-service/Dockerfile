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
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/gallery-service/target/*.jar app.jar
EXPOSE 8084
# Hardened JRE production execution
ENTRYPOINT ["java", "-XX:+UseG1GC", "-Xms256m", "-Xmx512m", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
