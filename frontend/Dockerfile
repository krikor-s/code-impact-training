# Use Node.js 24 as the base image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run the dev server
CMD ["npm", "run", "dev", "--", "--host"]