# Playwright's own base image ships Node.js plus every system library
# Chromium needs to run headlessly (fonts, libnss3, libatk, etc) already
# installed and version-matched to the `playwright` npm package below —
# this avoids the long, fragile apt-get dependency list that a plain
# node:20-slim base would otherwise need (see the research this Dockerfile
# is based on: missing even one Chromium system library causes cryptic
# startup failures). The version tag here MUST match the `playwright`
# version pinned in package.json, since Playwright refuses to drive a
# browser build that doesn't match its own npm package version.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src/ ./src/

# Cloud Run injects PORT at runtime (see server.js reading
# process.env.PORT) — this EXPOSE is documentation for humans/tooling, not
# something Cloud Run itself depends on.
EXPOSE 8080

CMD ["node", "src/server.js"]