# Parent image
FROM node:20-bookworm-slim AS builder

LABEL description="Data Ingest Board"

# Change to directory that contains the Dockerfile
WORKDIR /usr/src/app

# Copy from host to image
COPY . .
COPY --chmod=755 ./entrypoint.sh /usr/local/bin/entrypoint.sh

# Update the package list and install git
RUN apt-get update -y && \
    apt-get dist-upgrade -y && \
    apt-get install git -y

# Change to source code directory
WORKDIR /usr/src/app/src

# Update npm, install dependencies, build the project, remove dev dependencies
ENV NODE_ENV=production
RUN npm install -g npm@latest && \
    npm install && \
    npm run build && \
    npm prune --production

# Clean up
RUN apt-get purge -y git && \
    apt-get auto-remove -y

# The EXPOSE instruction informs Docker that the container listens on the specified network ports at runtime. 
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
