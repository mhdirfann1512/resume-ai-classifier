# Stage 1: Build fail JAR guna Maven
FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Jalankan JAR (TUKAR BARIS INI)
# Guna eclipse-temurin sebab openjdk:17-jdk-slim dah tak wujud
FROM eclipse-temurin:17-jre-alpine 
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]