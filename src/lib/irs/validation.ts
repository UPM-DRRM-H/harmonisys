import { CITY_TO_REGION } from '@/utils/philippineRegions';

export const IRS_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const IRS_MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function isCoordinateOnlyLocation(location: string): boolean {
    return /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location.trim());
}

export function containsPhilippineCity(location: string): boolean {
    if (!location.trim()) return false;

    const lower = location.toLowerCase();
    return Object.keys(CITY_TO_REGION).some((city) => lower.includes(city));
}

export function validateIncidentLocation(
    location: string,
    options?: { autoLoadFailed?: boolean }
): { valid: boolean; error?: string } {
    const trimmed = location.trim();

    if (!trimmed) {
        return {
            valid: false,
            error: options?.autoLoadFailed
                ? 'Auto-location failed. Please enter a specific location manually.'
                : 'Specific location is required.',
        };
    }

    if (isCoordinateOnlyLocation(trimmed)) {
        return {
            valid: false,
            error: 'Coordinates alone are not accepted. Please add a city or municipality (e.g., "UP Manila, Manila").',
        };
    }

    if (!containsPhilippineCity(trimmed)) {
        return {
            valid: false,
            error: options?.autoLoadFailed
                ? 'Auto-location failed. Please enter a specific location that includes a valid Philippine city or municipality.'
                : 'Please ensure your specific location includes a valid Philippine city or municipality.',
        };
    }

    if (trimmed.length < 5) {
        return {
            valid: false,
            error: 'Please provide a more specific location.',
        };
    }

    return { valid: true };
}

export function validateIncidentAttachment(file: File): {
    valid: boolean;
    error?: string;
} {
    if (file.size === 0) {
        return { valid: false, error: `"${file.name}" is empty.` };
    }

    if (file.size > IRS_MAX_ATTACHMENT_SIZE_BYTES) {
        return {
            valid: false,
            error: `"${file.name}" exceeds the 10 MB limit.`,
        };
    }

    if (
        !IRS_ALLOWED_MIME_TYPES.includes(
            file.type as (typeof IRS_ALLOWED_MIME_TYPES)[number]
        )
    ) {
        return {
            valid: false,
            error: `"${file.name}" has an unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX.`,
        };
    }

    return { valid: true };
}

export function validateIncidentAttachments(
    files: File[]
): { valid: boolean; error?: string } {
    for (const file of files) {
        const result = validateIncidentAttachment(file);
        if (!result.valid) {
            return result;
        }
    }

    return { valid: true };
}
