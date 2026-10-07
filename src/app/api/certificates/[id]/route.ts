import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { WorkflowError } from '@/lib/validation';
export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireUser();
        const { id } = await context.params;
        const certificate = await prisma.certificateUpload.findFirst({
            where: {
                id,
                ...(user.role === 'ADMIN' ? {} : { userId: user.id }),
            },
        });
        if (!certificate)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return new Response(new Uint8Array(certificate.bytes), {
            headers: {
                'Content-Type': certificate.contentType,
                'Content-Disposition':
                    'attachment; filename="' + certificate.filename + '"',
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (e) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
