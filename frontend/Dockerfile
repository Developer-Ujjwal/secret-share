FROM node:18-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --shamefully-hoist

COPY . .
RUN pnpm build

FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY --from=deps /app/.next ./.next
COPY --from=deps /app/public ./public
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
CMD ["pnpm", "start"]
