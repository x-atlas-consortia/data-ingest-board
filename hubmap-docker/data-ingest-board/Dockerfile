# Parent image
FROM hubmap/api-base-image:1.0.0

LABEL description="HuBMAP Data Ingest Board"

# Change to directory that contains the Dockerfile
WORKDIR /usr/src/app

# Copy from host to image
COPY . .

# Reduce the number of layers in image by minimizing the number of separate RUN commands
# Add Node.js stable release Yum Repository
# Install Node.js v18.x (includes npm) based on https://github.com/nodesource/distributions?tab=readme-ov-file#as-root-2
# Update to latest npm
# Copy the entrypoint script and make it executible
# Clean all yum cache
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && \
    yum install -y nodejs && \
    npm install npm@latest -g && \
    cp /usr/src/app/entrypoint.sh /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh && \
    yum clean all
    
# Change to source code directory
WORKDIR /usr/src/app/src

# Install npm dependencies and build app
RUN npm install && \
    npm run build

# The EXPOSE instruction informs Docker that the container listens on the specified network ports at runtime. 
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["npm", "run", "start"]