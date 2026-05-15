# Use Node.js 24 as the base image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Copy the Prisma schema so postinstall's `prisma generate` can find it
COPY prisma ./prisma

# Install all dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose port 3000 so the container can be reached
EXPOSE 3000

# Start the compiled server
CMD ["node", "dist/index.js"]