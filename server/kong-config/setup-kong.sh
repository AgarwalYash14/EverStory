#!/bin/bash

# Wait for Kong to be available
echo "Waiting for Kong Admin API to be available..."
while ! curl -s http://kong-gateway:8101 > /dev/null; do
  sleep 5
  echo "Still waiting for Kong Admin API..."
done

echo "Kong Admin API is available. Setting up services and routes..."

# Check if services already exist before creating them
AUTH_SERVICE=$(curl -s http://kong-gateway:8101/services/auth-service | grep -c "id")
if [ "$AUTH_SERVICE" -eq 0 ]; then
  echo "Creating auth service..."
  # Create Auth Service in Kong - updated port in internal docker network
  curl -i -X POST http://kong-gateway:8101/services \
    --data name=auth-service \
    --data url=http://auth-service:8000
  
  # Create Auth Service routes - use strip_path=false to preserve the entire path
  curl -i -X POST http://kong-gateway:8101/services/auth-service/routes \
    --data "paths[]=/api/auth" \
    --data "strip_path=false" \
    --data name=auth-route
else
  echo "Auth service already exists, skipping creation"
fi

# Check if image service exists
IMAGE_SERVICE=$(curl -s http://kong-gateway:8101/services/image-service | grep -c "id")
if [ "$IMAGE_SERVICE" -eq 0 ]; then
  echo "Creating image service..."
  # Create Image Service in Kong
  curl -i -X POST http://kong-gateway:8101/services \
    --data name=image-service \
    --data url=http://image-service:8000
  
  # Create Image Service routes
  curl -i -X POST http://kong-gateway:8101/services/image-service/routes \
    --data "paths[]=/api/posts" \
    --data "paths[]=/api/comments" \
    --data "paths[]=/api/likes" \
    --data "strip_path=false" \
    --data name=image-routes
else
  echo "Image service already exists, skipping creation"
fi

# Check if friendship service exists
FRIENDSHIP_SERVICE=$(curl -s http://kong-gateway:8101/services/friendship-service | grep -c "id")
if [ "$FRIENDSHIP_SERVICE" -eq 0 ]; then
  echo "Creating friendship service..."
  # Create Friendship Service in Kong with correct base URL (no /api suffix)
  curl -i -X POST http://kong-gateway:8101/services \
    --data name=friendship-service \
    --data url=http://friendship-service:8000
  
  # Create Friendship Service routes - use regex paths to capture all friendship routes
  curl -i -X POST http://kong-gateway:8101/services/friendship-service/routes \
    --data "paths[]=/api/friendships" \
    --data "paths[]=/api/friendships/" \
    --data "paths[]=/api/friendships/pending" \
    --data "paths[]=/api/friendships/requests" \
    --data "paths[]=/api/friendships/([0-9]+)" \
    --data "strip_path=false" \
    --data name=friendship-route
else
  echo "Friendship service already exists, updating it..."
  # Update the service URL
  curl -i -X PATCH http://kong-gateway:8101/services/friendship-service \
    --data url=http://friendship-service:8000
  
  # Update the routes to include all necessary paths
  FRIENDSHIP_ROUTE=$(curl -s http://kong-gateway:8101/services/friendship-service/routes | grep -o '"id":"[^"]*"' | grep -o '[^"]*$' | head -1)
  if [ -n "$FRIENDSHIP_ROUTE" ]; then
    echo "Updating friendship routes..."
    curl -i -X PATCH http://kong-gateway:8101/routes/$FRIENDSHIP_ROUTE \
      --data "paths[]=/api/friendships" \
      --data "paths[]=/api/friendships/" \
      --data "paths[]=/api/friendships/pending" \
      --data "paths[]=/api/friendships/requests" \
      --data "paths[]=/api/friendships/([0-9]+)" \
      --data "strip_path=false"
  fi
fi

# Check if websocket service exists
WEBSOCKET_SERVICE=$(curl -s http://kong-gateway:8101/services/websocket-service | grep -c "id")
if [ "$WEBSOCKET_SERVICE" -eq 0 ]; then
  echo "Creating websocket service..."
  # Create WebSocket Service in Kong
  curl -i -X POST http://kong-gateway:8101/services \
    --data name=websocket-service \
    --data url=http://websocket-service:8000
  
  # Create WebSocket Service routes
  # First route for regular HTTP endpoints
  curl -i -X POST http://kong-gateway:8101/services/websocket-service/routes \
    --data "paths[]=/api/ws" \
    --data "strip_path=false" \
    --data name=websocket-http-route
  
  # Second route specifically for WebSocket connections
  curl -i -X POST http://kong-gateway:8101/services/websocket-service/routes \
    --data "paths[]=/ws" \
    --data "strip_path=false" \
    --data "protocols[]=http" \
    --data "protocols[]=https" \
    --data "protocols[]=ws" \
    --data "protocols[]=wss" \
    --data name=websocket-ws-route
else
  echo "WebSocket service already exists, skipping creation"
fi

# Remove any existing CORS plugin to avoid duplicates
echo "Removing any existing CORS plugins..."
PLUGINS=$(curl -s http://kong-gateway:8101/plugins | grep -o '"id":"[^"]*"' | grep -o '[^"]*$')
if [ -n "$PLUGINS" ]; then
  for plugin_id in $PLUGINS; do
    PLUGIN_NAME=$(curl -s http://kong-gateway:8101/plugins/$plugin_id | grep -o '"name":"[^"]*"' | grep -o '[^"]*$' | head -1)
    if [ "$PLUGIN_NAME" = "cors" ]; then
      echo "Removing existing CORS plugin with ID: $plugin_id"
      curl -i -X DELETE http://kong-gateway:8101/plugins/$plugin_id
    fi
  done
fi

# Enhanced CORS plugin globally with fixed configuration
echo "Setting up CORS plugin..."
curl -i -X POST http://kong-gateway:8101/plugins \
  --data "name=cors" \
  --data "config.origins=*" \
  --data "config.methods[]=GET" \
  --data "config.methods[]=POST" \
  --data "config.methods[]=PUT" \
  --data "config.methods[]=DELETE" \
  --data "config.methods[]=OPTIONS" \
  --data "config.methods[]=PATCH" \
  --data "config.headers=Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers" \
  --data "config.exposed_headers=Authorization" \
  --data "config.credentials=true" \
  --data "config.max_age=3600"

echo "Kong setup completed successfully!"