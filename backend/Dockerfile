# Image kecil untuk Cloud Run. Build dari folder backend/:  gcloud run deploy --source .
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
# Jalan sebagai pengguna non-root bawaan image.
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
