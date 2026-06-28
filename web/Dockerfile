# Stage 1: Build Next.js project
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy files as the non-root node user
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
