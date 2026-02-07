import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const proposalsRouter = Router();

proposalsRouter.post('/', async (req, res, next) => {
  try {
    const proposalId = uuidv4();
    // TODO: validate, insert, publish proposal_submitted event, trigger fraud check
    res.status(201).json({ id: proposalId, message: 'Proposal submitted' });
  } catch (err) {
    next(err);
  }
});

proposalsRouter.get('/job/:jobId', async (req, res, next) => {
  try {
    // TODO: list proposals for a job
    res.json({ proposals: [], total: 0 });
  } catch (err) {
    next(err);
  }
});
