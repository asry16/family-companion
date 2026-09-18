import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { setupWebSocket } from './websocket';
import authRoutes from './routes/auth';
import familyRoutes from './routes/family';
import telemetryRoutes from './routes/telemetry';
import plannerRoutes from './routes/planner';
import vaultRoutes from './routes/vault';
import aiRoutes from './routes/ai';

const app = express();
const server = http.createServer(app);

// CORS configuration - allow all origins in development for Expo web & mobile clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with 25mb limit for OCR base64 scans
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Kinly FamilyOS API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/ai', aiRoutes);

// Setup Real-time WebSocket multiplexer on /ws
setupWebSocket(server);

// 404 Catch-all handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Kinly FamilyOS Backend Server running!`);
  console.log(`📡 HTTP API:      http://localhost:${PORT}/api`);
  console.log(`⚡ WebSocket Bus: ws://localhost:${PORT}/ws`);
  console.log(`🏥 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

export { app, server };
