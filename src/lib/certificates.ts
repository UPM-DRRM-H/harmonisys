import { WorkflowError } from '@/lib/validation';
export const CERTIFICATE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export async function readCertificate(file: unknown) {
    if (
        !(file instanceof File) ||
        !file.size ||
        file.size > 5 * 1024 * 1024 ||
        !CERTIFICATE_TYPES.includes(file.type)
    )
        throw new WorkflowError(
            'Provide a PDF, image or Word certificate under 5 MB.'
        );
    return {
        filename: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
        contentType: file.type,
        bytes: Buffer.from(await file.arrayBuffer()),
    };
}
export function certificatePath(id: string) {
    return '/api/certificates/' + id;
}
