# Stage 1: Build fail JAR guna Maven
FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Jalankan JAR guna JRE yang ringan
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Port yang Spring Boot guna
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]