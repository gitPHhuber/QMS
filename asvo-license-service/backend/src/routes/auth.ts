import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import Redis from 'ioredis';
import crypto from 'crypto';
import { ProvisioningService } from '../services/ProvisioningService';
import { sendEmail } from '../utils/email';
import { getConfig, TierName } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const registerSchema = z.object({
  orgName: z.string().min(1),
  inn: z.string().min(10).max(12),
  email: z.string().email(),
  contactName: z.string().min(1),
  tier: z.enum(['start', 'standard', 'pro', 'industry', 'corp']),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function authRoutes(app: FastifyInstance) {
  const config = getConfig();
  const redis = new Redis(config.REDIS_URL);

  // POST /api/v1/auth/register — public, register new organization
  app.post('/api/v1/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const result = await ProvisioningService.register({
      orgName: body.orgName,
      inn: body.inn,
      email: body.email,
      contactName: body.contactName,
      tier: body.tier as TierName,
      phone: body.phone,
    });

    logger.info({ orgId: result.organization.id, email: body.email }, 'Portal registration completed');

    return reply.status(201).send({
      organization: result.organization,
      subscription: result.subscription,
      message: 'Registration successful. Check your email for further instructions.',
    });
  });

  // POST /api/v1/auth/login — public, send OTP to email
  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // Verify the email belongs to an existing organization
    const org = await prisma.organization.findFirst({
      where: { contactEmail: body.email },
    });

    if (!org) {
      return reply.status(404).send({ error: 'Organization not found for this email' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with 5-minute TTL
    const redisKey = `otp:${body.email}`;
    await redis.set(redisKey, otp, 'EX', 300);

    // Send OTP via email
    await sendEmail(body.email, 'Код подтверждения ASVO-QMS', 'otp', {
      otp,
      orgName: org.name,
    });

    logger.info({ email: body.email }, 'OTP sent for portal login');

    return { message: 'OTP sent to your email' };
  });

  // POST /api/v1/auth/verify-otp — public, verify OTP and return JWT
  app.post('/api/v1/auth/verify-otp', async (request, reply) => {
    const body = verifyOtpSchema.parse(request.body);

    const redisKey = `otp:${body.email}`;
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp) {
      return reply.status(400).send({ error: 'OTP expired or not found' });
    }

    if (storedOtp !== body.otp) {
      return reply.status(400).send({ error: 'Invalid OTP' });
    }

    // Delete OTP after successful verification
    await redis.del(redisKey);

    // Find organization for this email
    const org = await prisma.organization.findFirst({
      where: { contactEmail: body.email },
    });

    if (!org) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    // Sign JWT with portal scope
    const token = app.jwt.sign(
      {
        sub: body.email,
        scope: 'portal',
        orgId: org.id,
      },
      { expiresIn: '24h' },
    );

    logger.info({ email: body.email, orgId: org.id }, 'Portal login successful');

    return {
      token,
      organization: {
        id: org.id,
        name: org.name,
        tier: org.tier,
        status: org.status,
      },
    };
  });
}
