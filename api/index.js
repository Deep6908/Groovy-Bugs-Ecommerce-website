// Vercel Serverless Function entry point.
// Vercel requires functions to live in the /api directory at the project root.
// This file simply imports and re-exports the configured Express app so Vercel
// can wrap it as a serverless function and route /api/* traffic to it.
import app from '../backend/server.js';

export default app;
