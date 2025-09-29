# Imagen base oficial de Node.js
FROM node:18

# Crear directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar todo el código de tu backend al contenedor
COPY . .

# Exponer el puerto que usa tu backend (ajústalo si no es 3000)
EXPOSE 5000

# Comando por defecto al arrancar el contenedor
CMD ["npm", "start"]
