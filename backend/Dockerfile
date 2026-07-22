# Playwright's own base image ships Node.js plus every system library
# Chromium needs to run headlessly (fonts, libnss3, libatk, etc) already
# installed and version-matched to the `playwright` npm package below —
# this avoids the long, fragile apt-get dependency list that a plain
# node:20-slim base would otherwise need (see the research this Dockerfile
# is based on: missing even one Chromium system library causes cryptic
# startup failures).
#
# The version tag here MUST exactly match the `playwright` version in
# package.json — not just "close enough". Playwright itself refuses to
# launch a browser when it detects a version mismatch (see a real instance
# of this: an earlier deploy used a caret range "^1.48.0" in package.json,
# npm resolved that to 1.61.1 at install time while this image stayed on
# v1.48.0-jammy, and every request failed at browser launch with "Looks
# like Playwright was just updated... Please update docker image as
# well"). That's why package.json pins `"playwright": "1.48.0"` with no
# caret — an exact version, not a range — so a future `npm install` can
# never silently drift ahead of whatever's pinned here again.
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