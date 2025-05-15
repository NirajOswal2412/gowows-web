# Use the Node.js 18 base image
FROM node:20

# Set the working directory
WORKDIR /

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the application code
COPY . .

# Build the Vite application
RUN npm run build

# Expose the default port for Vite preview
EXPOSE 8080

# Use Vite's preview server to serve the app
CMD ["npm", "run", "preview", "--", "--port", "8080", "--host"]
