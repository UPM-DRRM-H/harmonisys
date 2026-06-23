import { type NextRequest, NextResponse } from 'next/server';
import { IncidentCategory, SeverityLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
    validateIncidentAttachments,
    validateIncidentLocation,
} from '@/lib/irs/validation';

// Helper function to convert form category to enum value
function convertCategoryToEnum(category: string): IncidentCategory {
    // FormData sends enum values as strings, validate and convert
    const validCategories = Object.values(IncidentCategory);
    if (validCategories.includes(category as IncidentCategory)) {
        return category as IncidentCategory;
    }
    // Fallback to default if invalid
    console.warn(`Invalid category received: ${category}, using default`);
    return IncidentCategory.SAFETY_HAZARD;
}

// Helper function to convert severity to enum value
function convertSeverityToEnum(severity: string): SeverityLevel {
    // FormData sends enum values as strings, validate and convert
    const validSeverities = Object.values(SeverityLevel);
    if (validSeverities.includes(severity as SeverityLevel)) {
        return severity as SeverityLevel;
    }
    // Fallback to default if invalid
    console.warn(`Invalid severity received: ${severity}, using default`);
    return SeverityLevel.LOW;
}

export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        // Extract form fields
        const location = formData.get('location') as string;
        const date = formData.get('date') as string;
        const summary = formData.get('summary') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const reporter = formData.get('reporter') as string;
        const contact = formData.get('contact') as string;
        const teamDeployed = formData.get('teamDeployed') as string;
        const otherCategoryDetail = formData.get('otherCategoryDetail') as
            | string
            | null;

        // Validate required fields
        if (
            !location ||
            !date ||
            !summary ||
            !description ||
            !category ||
            !teamDeployed
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Required Other Details for Category
        if (
            (category as IncidentCategory) === IncidentCategory.OTHER &&
            !otherCategoryDetail
        ) {
            return NextResponse.json(
                { error: 'Please specify details for "Other" category' },
                { status: 400 }
            );
        }

        // Validate summary length
        if (summary.length > 150) {
            return NextResponse.json(
                { error: 'Summary must be 150 characters or less' },
                { status: 400 }
            );
        }

        const locationValidation = validateIncidentLocation(location);
        if (!locationValidation.valid) {
            return NextResponse.json(
                { error: locationValidation.error },
                { status: 400 }
            );
        }

        // Handle file attachments
        const attachments: string[] = [];
        const files = formData.getAll('attachments') as File[];
        const nonEmptyFiles = files.filter((file) => file.size > 0);

        const attachmentValidation =
            validateIncidentAttachments(nonEmptyFiles);
        if (!attachmentValidation.valid) {
            return NextResponse.json(
                { error: attachmentValidation.error },
                { status: 400 }
            );
        }

        // Note: For production, you'd want to upload files to a storage service
        // like Vercel Blob, AWS S3, or similar and store the URLs
        for (const file of nonEmptyFiles) {
            attachments.push(file.name);
        }

        // Create incident in database
        const incident = await prisma.incident.create({
            data: {
                userId: session.user.id,
                location,
                date: new Date(date),
                summary,
                description,
                category: convertCategoryToEnum(category),
                reporter: reporter || null,
                contact: contact || null,
                teamDeployed,
                attachments,
                otherCategoryDetail:
                    (category as IncidentCategory) === IncidentCategory.OTHER
                        ? otherCategoryDetail
                        : null,
            },
        });

        return NextResponse.json(
            {
                message: 'Incident reported successfully',
                incidentId: incident.id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating incident:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const incidents = await prisma.incident.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(incidents);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
