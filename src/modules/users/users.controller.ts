import { Response } from 'express';
import * as UsersService from './users.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { AuthRequest } from '../../types';

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UsersService.getAllUsers();
    sendSuccess(res, 'Users retrieved successfully.', users);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch users.', err.status || 500);
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId    = Number(req.params.userId);
    const requestor = req.user!;

    // Customer can only update themselves
    if (requestor.role === 'customer' && requestor.userId !== userId) {
      sendError(res, 'Forbidden. You can only update your own profile.', 403);
      return;
    }

    // Only admin can change roles
    if (req.body.role && requestor.role !== 'admin') {
      sendError(res, 'Forbidden. Only admins can change roles.', 403);
      return;
    }

    const updated = await UsersService.updateUser(userId, req.body);
    sendSuccess(res, 'User updated successfully.', updated);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update user.', err.status || 500);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    await UsersService.deleteUser(userId);
    sendSuccess(res, 'User deleted successfully.', null);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete user.', err.status || 500);
  }
};