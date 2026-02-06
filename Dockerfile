# Multi-stage build for Student Management System
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev && npm cache clean --force

# Backend stage
FROM base AS backend

# Copy backend source
COPY server/ ./server/
COPY database/ ./database/

# Create uploads directory
RUN mkdir -p server/uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start backend
CMD ["node", "server/index.js"]

# Frontend build stage
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install && cd client && npm install

# Copy source code
COPY client/ ./client/

# Build React app
RUN cd client && npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built React app
COPY --from=frontend-build /app/client/build /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
