import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyResetTokenSchema, updateProfileSchema } from '../../utils/validators';
import * as authService from './auth.service';
import { successResponse } from '../../utils/helpers';
import { AuthenticationError } from '../../utils/errors';

export async function register(req: AuthenticatedRequest, res: Response) {
  const { email, password, firstName, lastName } = req.body;
  const result = await authService.register({ email, password, firstName, lastName });
  res.status(201).json(successResponse(result));
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json(successResponse(result));
}

export async function refresh(req: AuthenticatedRequest, res: Response) {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshTokens(refreshToken);
  res.json(successResponse(tokens));
}

export async function logout(_req: AuthenticatedRequest, res: Response) {
  res.json(successResponse({ message: 'Logged out successfully' }));
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  const profile = await authService.getProfile(req.user.userId);
  res.json(successResponse(profile));
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  const { firstName, lastName, locale, avatarUrl } = req.body;
  const profile = await authService.updateProfile(req.user.userId, { firstName, lastName, locale, avatarUrl });
  res.json(successResponse(profile));
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.userId, currentPassword, newPassword);
  res.json(successResponse({ message: 'Password changed successfully' }));
}

export async function forgotPassword(req: AuthenticatedRequest, res: Response) {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.json(successResponse({ message: 'If the email exists, a reset link has been sent' }));
}

export async function resetPassword(req: AuthenticatedRequest, res: Response) {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  res.json(successResponse({ message: 'Password has been reset successfully' }));
}

export async function verifyResetToken(req: AuthenticatedRequest, res: Response) {
  const { token } = req.body;
  await authService.verifyResetToken(token);
  res.json(successResponse({ valid: true }));
}

export const authValidators = {
  register: registerSchema,
  login: loginSchema,
  refresh: refreshTokenSchema,
  changePassword: changePasswordSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  verifyResetToken: verifyResetTokenSchema,
  updateProfile: updateProfileSchema,
};