import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from '@fastify/jwt';
import { getConfig } from '../config';

const prisma = new PrismaClient();

export async function bearerAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  const config = getConfig();

  if (token === config.ADMIN_TOKEN) {
    (request as any).authType = 'admin';
    (request as any).actor = 'admin';
    return;
  }

  try {
    const decoded = await request.jwtVerify<{ sub: string; scope: string; orgId?: string }>();
    (request as any).authType = decoded.scope || 'admin';
    (request as any).actor = decoded.sub;
    (request as any).orgId = decoded.orgId;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function apiKeyAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('ApiKey ')) {
    return reply.status(401).send({ error: 'Missing ApiKey authorization' });
  }

  const apiKey = authHeader.slice(7);
  const instance = await prisma.instance.findUnique({
    where: { apiKey },
    include: { organization: true },
  });

  if (!instance) {
    return reply.status(401).send({ error: 'Invalid API key' });
  }

  (request as any).authType = 'instance';
  (request as any).instance = instance;
  (request as any).actor = `instance:${instance.id}`;
}

export async function portalAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing Authorization header' });
  }

  try {
    const decoded = await request.jwtVerify<{ sub: string; scope: string; orgId: string }>();
    if (decoded.scope !== 'portal') {
      return reply.status(403).send({ error: 'Invalid token scope' });
    }
    (request as any).authType = 'portal';
    (request as any).orgId = decoded.orgId;
    (request as any).actor = `portal:${decoded.sub}`;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
