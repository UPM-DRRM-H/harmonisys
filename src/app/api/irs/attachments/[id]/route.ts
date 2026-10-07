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
        const file = await prisma.incidentAttachment.findFirst({
            where: {
                id: (await context.params).id,
                ...(user.role === 'ADMIN'
                    ? {}
                    : { incident: { userId: user.id } }),
            },
        });
        if (!file)
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return new Response(new Uint8Array(file.bytes), {
            headers: {
                'Content-Type': file.contentType,
                'Content-Disposition':
                    'attachment; filename="' + file.filename + '"',
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
