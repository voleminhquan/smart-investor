import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { companiesRouter } from './routes/companies';
import { pricesRouter } from './routes/prices';
import { financialsRouter } from './routes/financials';
import { collectionsRouter } from './routes/collections';
import { syncRouter } from './routes/sync';
import { portfolioRouter } from './routes/portfolio';
import { analysisRouter } from './routes/analysis';
import { startScheduler } from './sync/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/companies', companiesRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/financials', financialsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/analysis', analysisRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Skip starting the server and cron jobs if running on Vercel Serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Smart Investor API running on http://localhost:${PORT}`);
    startScheduler();
  });
}

export default app;
