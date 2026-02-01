import { z } from 'zod';
import { insertAlertSchema, insertDeviceSchema, insertIncidentSchema, insertLogSchema, alerts, devices, incidents, logs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  alerts: {
    list: {
      method: 'GET' as const,
      path: '/api/alerts',
      responses: {
        200: z.array(z.custom<typeof alerts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/alerts',
      input: insertAlertSchema,
      responses: {
        201: z.custom<typeof alerts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/alerts/:id',
      input: insertAlertSchema.partial(),
      responses: {
        200: z.custom<typeof alerts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  devices: {
    list: {
      method: 'GET' as const,
      path: '/api/devices',
      responses: {
        200: z.array(z.custom<typeof devices.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/devices/:id',
      responses: {
        200: z.custom<typeof devices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  incidents: {
    list: {
      method: 'GET' as const,
      path: '/api/incidents',
      responses: {
        200: z.array(z.custom<typeof incidents.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/incidents/:id',
      responses: {
        200: z.custom<typeof incidents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
