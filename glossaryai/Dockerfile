# ===== Stage 1: Build =====
# Use an official Node.js runtime as a parent image.
# Alpine Linux is a good choice for smaller image sizes.
FROM node:20-alpine AS builder

# Set the working directory in the container.
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, pnpm-lock.yaml)
# This step leverages Docker's cache. If these files haven't changed,
# Docker won't re-run npm install.
COPY package*.json ./

# Install project dependencies.
# Using 'npm ci' is generally recommended for CI/CD as it installs based on package-lock.json
# and can be faster and more reliable.
RUN npm ci

# Copy the rest of the application code into the container.
COPY . .

# Set the public API URL build argument (can be overridden at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application for production.
RUN npm run build

# ===== Stage 2: Production =====
# Use a smaller Node.js image for the production stage.
FROM node:20-alpine

# Set the working directory.
WORKDIR /app

# Set environment to production (Next.js specific).
ENV NODE_ENV production

# Copy built assets from the builder stage.
# This includes the .next folder, public folder, and package.json (for start script).
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/node_modules    ./node_modules

# Expose the port the app runs on.
EXPOSE 3000

# Define the command to run the application.
# 'next start' is the command to run a production Next.js server.
CMD ["npm", "start"]
