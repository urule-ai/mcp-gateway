import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { redactSecrets } from '@urule/events';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Zod validation failures get the historical `{ error: 'Validation failed',
  // details }` envelope so existing API consumers + tests don't see the
  // type-provider's default Fastify error shape.
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.code(400).send({
      error: 'Validation failed',
      details: error.validation,
    });
  }

  request.log.error(
    {
      err: {
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        message: redactSecrets(error.message ?? ''),
        stack: error.stack ? redactSecrets(error.stack) : undefined,
      },
      requestId: request.id,
    },
    'Request error',
  );

  const statusCode = error.statusCode ?? 500;

  reply.status(statusCode).send({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: redactSecrets(error.message ?? 'Internal Server Error'),
      requestId: request.id,
    },
  });
}
