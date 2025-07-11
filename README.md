# FocusBee WebSocket Server

A standalone WebSocket server for the FocusBee application, designed to be deployed on Render.

## Features

- Real-time communication between web and mobile clients
- Session-based room management
- Support for ritual steps, timer selection, and focus sessions
- Health check endpoint for monitoring
- Graceful shutdown handling
- CORS configuration for production deployment

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

4. For production mode:

```bash
npm start
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `SERVER_ID`: Optional server identifier

## API Endpoints

- `GET /health`: Health check endpoint returning server status

## WebSocket Events

### Client to Server

- `join-session`: Join a session room
- `phone-connected`: Notify that phone has connected
- `ritual-step`: Update ritual step progress
- `timer-selected`: Select a timer
- `ritual-complete`: Complete ritual
- `focus-session-start`: Start focus session
- `focus-session-end`: End focus session
- `ping`: Connection test

### Server to Client

- `client-joined`: New client joined session
- `client-left`: Client left session
- `phone-connected`: Phone connected to session
- `ritual-step`: Ritual step update
- `timer-selected`: Timer selection update
- `ritual-complete`: Ritual completion
- `focus-session-start`: Focus session started
- `focus-session-end`: Focus session ended

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set the build command: `npm install`
4. Set the start command: `npm start`
5. Add environment variables in the Render dashboard
6. Deploy!

## Production Considerations

- Set `ALLOWED_ORIGINS` to your specific domains for security
- Monitor the `/health` endpoint for uptime
- Consider implementing rate limiting for production use
- Use environment variables for sensitive configuration
# focusbee-ws
