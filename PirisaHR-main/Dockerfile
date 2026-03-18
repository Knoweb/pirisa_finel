# --- Build Stage ---
FROM node:20-alpine AS build

# Use non-root user for node where possible (already built-in 'node' user)
WORKDIR /app

# Enable npm caching for faster builds
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy the source files
COPY . .

# Build Vite/React application for production
RUN npm run build

# --- Production/Serve Stage ---
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production built static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Run in foreground
CMD ["nginx", "-g", "daemon off;"]
