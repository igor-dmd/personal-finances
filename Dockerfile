FROM node:20-slim AS backend-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS frontend-deps

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:20-slim AS build

WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=frontend-deps /app/frontend/node_modules ./frontend/node_modules
COPY . .

RUN npm run build:all

FROM node:20-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/data/sqlite.db

WORKDIR /app
RUN mkdir -p /data

COPY package.json package-lock.json ./
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
