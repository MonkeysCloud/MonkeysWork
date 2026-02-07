import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
// import { db } from '../models/db';
// import { publishEvent } from '../events/publisher';

export const jobsRouter = Router();

jobsRouter.get('/', async (req, res, next) => {
  try {
    // TODO: implement with db query
    res.json({ jobs: [], total: 0, page: 1 });
  } catch (err) {
    next(err);
  }
});

jobsRouter.post('/', async (req, res, next) => {
  try {
    const jobId = uuidv4();
    // TODO: validate with zod, insert to DB, publish event
    // await publishEvent('job-events', {
    //   event_type: 'job_created',
    //   data: { job_id: jobId, ...req.body }
    // });
    res.status(201).json({ id: jobId, message: 'Job created' });
  } catch (err) {
    next(err);
  }
});

jobsRouter.get('/:id', async (req, res, next) => {
  try {
    // TODO: fetch job by ID, include AI scope if available
    res.json({ id: req.params.id });
  } catch (err) {
    next(err);
  }
});
