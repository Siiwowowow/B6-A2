import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response.util';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone) {
      sendError(res, 'name, email, password and phone are required.', 400);
      return;
    }

    const user = await AuthService.signup({ name, email, password, phone, role });
    sendSuccess(res, 'User registered successfully.', user, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Signup failed.', err.status || 500);
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'email and password are required.', 400);
      return;
    }

    const result = await AuthService.signin({ email, password });
    sendSuccess(res, 'Login successful.', result);
  } catch (err: any) {
    sendError(res, err.message || 'Signin failed.', err.status || 500);
  }
};