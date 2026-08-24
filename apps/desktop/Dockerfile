# FRIDAY web client (Vite dev server).
#
# Referenced by docker-compose.yml but missing, so `docker compose build` failed.
# This serves the React client for browser access; the Electron desktop shell and
# the Capacitor Android build are host-side concerns and are not containerised.

FROM node:22-alpine

ENV CI=true
WORKDIR /app

# Copy manifests first so dependency install is cached independently of source.
COPY package.json package-lock.json* ./
# `npm ci` requires a lockfile; fall back to `install` if one is not committed.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# node image ships a non-root `node` user; use it rather than running as root.
RUN chown -R node:node /app
USER node

EXPOSE 5173

# --host binds outside the container's loopback so the compose port mapping works.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
