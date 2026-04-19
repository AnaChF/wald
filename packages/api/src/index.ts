import express from 'express';
import cors from 'cors';
import { auditRouter } from './routes/audit';
import { treeRouter } from './routes/tree';
import { communityRouter } from './routes/community';
import { userRouter } from './routes/user';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
  }),
);
app.use(express.json({ limit: '10mb' }));

app.use('/api', auditRouter);
app.use('/api', treeRouter);
app.use('/api', communityRouter);
app.use('/api', userRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', ecosystem: 'wald' }));

app.listen(PORT, () => console.log(`Wald API running on port ${PORT}`));

export default app;
