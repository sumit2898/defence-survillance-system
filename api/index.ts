import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index';
import { registerRoutes } from '../server/routes';

let ready = false;

export default async (req: VercelRequest, res: VercelResponse) => {
    if (!ready) {
        // registerRoutes expects httpServer but it's not used in Vercel context (HTTP only)
        await registerRoutes({} as any, app);
        ready = true;
    }
    app(req, res);
};

