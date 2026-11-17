FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS base
RUN apk add --no-cache ffmpeg ca-certificates
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html vite.config.js SYSTEM_DOCUMENTATION.md ./
COPY src ./src
COPY server ./server
COPY shared ./shared
COPY scripts ./scripts
COPY docs ./docs
COPY tests ./tests
RUN npm test && npm run build && npm prune --omit=dev --ignore-scripts

FROM base AS runtime
RUN rm -rf /usr/local/lib/node_modules/npm /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4317
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/shared ./shared
COPY --from=build --chown=node:node /app/dist ./dist
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "require('node:http').get({hostname:'127.0.0.1',port:process.env.PORT||4317,path:'/api/health',headers:{host:new URL(process.env.APP_ORIGIN).host}},r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"]
CMD ["node", "server/index.js"]
