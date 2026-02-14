FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init wget

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app .
RUN mkdir -p static
USER node
EXPOSE 5000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
