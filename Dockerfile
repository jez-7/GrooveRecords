# IMAGEN MODELO
FROM eclipse-temurin:17.0.15_6-jdk

# PUERTO (INFORMATIVO)
EXPOSE 8080

# DIRECTORIO RAIZ
WORKDIR /root

# ARCHIVO DENTRO DEL CONTENEDOR
COPY ./pom.xml /root
COPY ./.mvn /root/.mvn
COPY ./mvnw /root

# DEPENDENCIAS
RUN ./mvnw dependency:go-offline

# CODIGO FUENTE DENTRO DEL CONTENEDOR
COPY ./src /root/src

# CONSTRUIR APP
RUN ./mvnw clean install -DskipTests

# LEVANTAR APLICACION CUANDO CONTENEDOR INICIE
ENTRYPOINT ["java", "-jar", "/root/target/GrooveRecords-0.0.1-SNAPSHOT.jar"]
