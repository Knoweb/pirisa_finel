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
# Use unprivileged Nginx image for better security (runs as non-root)
FROM nginxinc/nginx-unprivileged:1.25-alpine

# Set non-root working directory (Nginx unprivileged image runs as user 101)
USER nginx

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production built static assets
COPY --from=build /app/dist /usr/share/nginx/html

# The unprivileged Nginx image exposes port 8080 by default to avoid port 80 restrictions
EXPOSE 8080

# Run in foreground
CMD ["nginx", "-g", "daemon off;"]
