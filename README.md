docker build . -t barkin94/chess-backend
docker run -d -p 3001:3001 -e CORS_ORIGIN='http://localhost:3000' -e NODE_ENV='development' barkin94/chess-backend
