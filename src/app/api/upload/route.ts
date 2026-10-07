import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { certificatePath, readCertificate } from '@/lib/certificates';
import { WorkflowError } from '@/lib/validation';
export async function POST(req: Request) {
    try {
        const user = await requireUser();
        const certificate = await readCertificate(
            (await req.formData()).get('file')
        );
        const upload = await prisma.certificateUpload.create({
            data: { userId: user.id, ...certificate },
            select: { id: true },
        });
        return NextResponse.json({
            success: true,
            url: certificatePath(upload.id),
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message:
                    e instanceof WorkflowError ? e.message : 'Upload failed.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
