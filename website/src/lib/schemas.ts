import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least  8 characters long')
  .max(255, 'password cannot be longer than  255 characters');
export const signinSchema = z.object({
  username: z.string().min(3, 'Username must be at least  3 character long.'),
  password: passwordSchema,
});

export const signupSchema = signinSchema;
export const emailVerificationSchema = z.object({
  email: z.string().email().max(255),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least  3 character long.')
    .max(255),
  email: z.string().email().max(255).nullish(),
  avatar: z
    .instanceof(File)
    .refine(
      (data) => data.size < 1 * 1024 * 1024,
      'Exceeded file size limit (1MB).',
    )
    .nullish(),
});

export const codeSchema = z.object({
  code: z.string().length(6),
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export const resetTokenSchema = z.object({
  email: z.string().email().max(255),
});

export const validateResetTokenSchema = z.object({
  password: passwordSchema,
  token: z.string().max(255),
});

export const magicLinkTokenSchema = z.object({
  token: z.string().max(255),
});
