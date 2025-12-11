FROM node:20-slim

WORKDIR /app

COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port (if needed for future frontend or API)
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
