import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { paginationSchema, updateUserSchema } from '../../utils/validators';
import * as userService from './user.service';
import { successResponse } from '../../utils/helpers';

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { page, limit, search } = req.query;
  const result = await userService.getUsers({
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    search: search as string,
  });
  res.json(successResponse(result.data, result.meta));
}

export async function getUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const user = await userService.getUserById(id);
  res.json(successResponse(user));
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const user = await userService.updateUser(id, req.body);
  res.json(successResponse(user));
}

export const userValidators = {
  list: paginationSchema,
  update: updateUserSchema,
};