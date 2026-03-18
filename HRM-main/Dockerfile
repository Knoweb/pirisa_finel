# --- Build Stage ---
FROM maven:3.9.5-amazoncorretto-11 AS builder

WORKDIR /usr/src/app

# Option: Copy just the POM to cache dependencies
COPY pom.xml .
# Download dependencies offline to speed up subsequent builds
RUN mvn dependency:go-offline -B || true

# Copy source tree and package
COPY src ./src
RUN mvn clean package -DskipTests -e

# --- Production/Serve Stage ---
# Use an optimized Tomcat image based on Corretto
FROM tomcat:9-jdk11-corretto

# Prevent running tomcat with root privileges (industry standard for container security)
# Create a non-root user and group
RUN groupadd -r tomcat && useradd -m -g tomcat tomcat

# Switch to the non-root user
USER tomcat

# Clear default web applications (manager, docs, host-manager, etc.) for security
# Because we are non-root, this folder usually has root ownership, so we either 
# clear it as root before switching, or change ownership.
USER root
RUN rm -rf /usr/local/tomcat/webapps/* && \
    chown -R tomcat:tomcat /usr/local/tomcat
USER tomcat

# Expose HTTP port
EXPOSE 8080

# Best practice: use JVM environment variables directly
ENV JAVA_OPTS="-Xms512m -Xmx1024m -Djava.security.egd=file:/dev/./urandom"

# Copy built artifact as ROOT application so it responds at /
COPY --from=builder --chown=tomcat:tomcat /usr/src/app/target/HRM-1.war /usr/local/tomcat/webapps/ROOT.war

CMD ["catalina.sh", "run"]
