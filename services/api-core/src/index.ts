import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { healthRouter } from './routes/health';
import { jobsRouter } from './routes/jobs';
import { proposalsRouter } from './routes/proposals';
import { usersRouter } from './routes/users';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limiter';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ level: process.env.LOG_LEVEL || 'info' }));
app.use(rateLimiter);

// Routes
app.use('/healthz', healthRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/jobs', authMiddleware, jobsRouter);
app.use('/api/v1/proposals', authMiddleware, proposalsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`api-core listening on port ${PORT}`);
});

export default app;
