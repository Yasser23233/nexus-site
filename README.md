# Nexus Chat System

A simple Arabic chat application built with Express.js and SQLite. The project provides public and private messaging through a WebSocket server.

## Features
- User login via predefined names
- Public chat room and direct messages
- Stores messages in a SQLite database
- Shows online status using WebSocket

## Requirements
- Node.js 18+
- SQLite3

## Configuration
The server reads the database path from the `DB_PATH` environment variable. If not provided, it defaults to `database/nexus.db`.

## Running
Install dependencies and start the server:

```bash
npm install
npm start
```

To run in development mode with automatic reloads:

```bash
npm run dev
```

The application runs on the port defined in the `PORT` environment variable or `3000` by default.
