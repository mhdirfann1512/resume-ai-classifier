# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files dulu untuk letak dalam cache
COPY package*.json ./
RUN npm install

# Copy semua source code
COPY . .

# Build projek (akan hasilkan folder /dist)
RUN npm run build

# Stage 2: Serve stage guna Nginx
FROM nginx:stable-alpine

# Copy hasil build dari stage 1 ke folder default nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (default nginx)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]