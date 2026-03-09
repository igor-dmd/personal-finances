import type { Context } from 'hono';

export function parseIdParam(c: Context, key = 'id'): number | null {
    const id = Number.parseInt(c.req.param(key), 10);
    return Number.isNaN(id) ? null : id;
}

