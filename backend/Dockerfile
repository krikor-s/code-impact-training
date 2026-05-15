# Use Node.js 24 as the base image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Copy Prisma config and schema so postinstall's `prisma generate` can find them
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install all dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose port 3000 so the container can be reached
EXPOSE 3000

# Apply pending migrations then start the compiled server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
