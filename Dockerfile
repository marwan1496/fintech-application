# Stage 1: Build stage - install dependencies and copy source code
FROM node:22.14-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package files to the container
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Stage 2: Production stage - create a lean image for running the app
FROM node:22.14-alpine

# Set the working directory for the production image
WORKDIR /app

# Copy the built application files from the previous stage
COPY --from=build /app .

# Expose the port that the application listens on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "app.js"]
