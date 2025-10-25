# Use official Node.js 14 as base image
FROM  --platform=linux/amd64 node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code
COPY . .

# Expose port 3000 for the server
EXPOSE 3001

# Default command to start the application
CMD ["npm", "start"]
