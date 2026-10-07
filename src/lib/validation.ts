export function normalizeEmail(value: unknown): string {
    if (typeof value !== 'string')
        throw new Error('Enter a valid email address.');
    const email = value.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error('Enter a valid email address.');
    return email;
}
export function validPassword(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        value.length >= 8 &&
        value.length <= 128 &&
        /[A-Z]/.test(value) &&
        /[^a-zA-Z0-9]/.test(value)
    );
}
export class WorkflowError extends Error {
    constructor(
        message: string,
        public status = 400
    ) {
        super(message);
    }
}
