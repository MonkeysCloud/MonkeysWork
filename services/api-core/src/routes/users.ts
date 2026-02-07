import { Router } from 'express';

export const usersRouter = Router();

usersRouter.post('/register', async (req, res, next) => {
  try {
    // TODO: validate, hash password, insert, trigger verification
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/login', async (req, res, next) => {
  try {
    // TODO: validate credentials, return JWT
    res.json({ token: 'placeholder' });
  } catch (err) {
    next(err);
  }
});
