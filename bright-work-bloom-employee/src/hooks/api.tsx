const BASE_URL = '${import.meta.env.VITE_API_BASE_URL}';
function buildQuery(params: Record<string, unknown> = {}) {
    return Object.keys(params).length
        ? '?' + new URLSearchParams(params as Record<string, string>).toString()
        : '';
}

async function handleResponse(response: Response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(error.message || `HTTP error!`, response.status, error);
    }
    return response.json();
}

export class ApiError extends Error {
    status: number;
    data: unknown;
    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export async function get(url: string, params: Record<string, unknown> = {}) {
    const response = await fetch(`${BASE_URL}${url}${buildQuery(params)}`);
    return handleResponse(response);
}

export async function post(url: string, data = {}, params: Record<string, unknown> = {}) {
    const response = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function put(url: string, data = {}, params: Record<string, unknown> = {}) {
    const response = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function patch(url: string, data = {}, params: Record<string, unknown> = {}) {
    const response = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function del(url: string, params: Record<string, unknown> = {}) {
    const response = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}

// // GET
// const users = await get('/users');
// const user = await get('/users/1');
// const list = await get('/users', { page: 1, limit: 10 });

// // POST
// const created = await post('/users', { name: 'Alice', email: 'alice@example.com' });

// // PUT
// const replaced = await put('/users/1', { name: 'Alice', email: 'alice@example.com' });

// // PATCH
// const updated = await patch('/users/1', { name: 'Alice Updated' });

// // DELETE
// const deleted = await del('/users/1');