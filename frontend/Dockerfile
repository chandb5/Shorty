FROM nginx:alpine

# Copy pre-built files directly from local build directory
COPY build/ /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
