import { Prisma, UserType, MhpssLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { enqueueEmail, deliverEmail } from '@/lib/mail/outbox';
import { certificatePath } from '@/lib/certificates';
import { WorkflowError } from '@/lib/validation';

export async function createPendingRoleRequest(
    data: Prisma.RoleChangeRequestUncheckedCreateInput,
    client?: Prisma.TransactionClient
) {
    const create = async (tx: Prisma.TransactionClient) => {
        const request = await tx.roleChangeRequest.create({ data });
        const user = await tx.user.findUniqueOrThrow({
            where: { id: request.userId },
            select: { name: true, email: true },
        });
        const admins = await tx.user.findMany({
            where: { role: 'ADMIN', active: true },
            select: { id: true },
        });
        if (admins.length)
            await tx.notification.createMany({
                data: admins.map(({ id }) => ({
                    userId: id,
                    type: 'GENERAL',
                    title: 'New role upgrade request',
                    message:
                        (user.name || 'A user') +
                        ' requested ' +
                        request.toRole +
                        ' access.',
                    link: '/users',
                    refId: request.id,
                    refType: 'RoleChangeRequest',
                })),
            });
        await enqueueEmail(tx, 'role-request:' + request.id, 'ROLE_REQUEST', {
            userName: user.name,
            userEmail: user.email,
            toRole: request.toRole,
            requestId: request.id,
            requestedMhpssLevel: request.requestedMhpssLevel,
            requestedOrganization: request.requestedResponderOrganization,
            requestedCertUrl: request.requestedMhpssCertificateFileUrl
                ? new URL(
                      request.requestedMhpssCertificateFileUrl,
                      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                  ).href
                : null,
        });
        return request;
    };
    return client ? create(client) : prisma.$transaction(create);
}
export async function emailPendingRoleRequest(
    request: { id: string },
    _user?: unknown
) {
    const delivery = await prisma.emailDelivery.findUnique({
        where: { key: 'role-request:' + request.id },
        select: { id: true },
    });
    return delivery ? deliverEmail(delivery.id) : false;
}
export async function submitRoleRequest(
    userId: string,
    input: Record<string, unknown>
) {
    const toRole = input.toRole ?? 'RESPONDER';
    if (toRole !== 'RESPONDER' && toRole !== 'ADMIN')
        throw new WorkflowError('Choose Responder or Admin.');
    const organization =
        typeof input.requestedResponderOrganization === 'string'
            ? input.requestedResponderOrganization.trim()
            : '';
    const level = input.requestedMhpssLevel;
    const url = input.requestedMhpssCertificateFileUrl;
    if (
        toRole === 'RESPONDER' &&
        (!organization ||
            organization.length > 200 ||
            !Object.values(MhpssLevel).includes(level as MhpssLevel))
    )
        throw new WorkflowError(
            'Organization and a valid MHPSS level are required.'
        );
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (!user.active) throw new WorkflowError('Account is inactive.', 403);
        if (user.role === 'ADMIN' || user.role === toRole)
            throw new WorkflowError(
                'This is not an elevation from your current role.',
                403
            );
        if (
            await tx.roleChangeRequest.findFirst({
                where: { userId, status: 'PENDING' },
            })
        )
            throw new WorkflowError('You already have a pending request.', 409);
        let certificateId: string | undefined;
        if (toRole === 'RESPONDER') {
            const match =
                typeof url === 'string'
                    ? url.match(/^\/api\/certificates\/([a-z0-9]+)$/)
                    : null;
            if (!match)
                throw new WorkflowError(
                    'Upload your certificate before requesting Responder access.'
                );
            const certificate = await tx.certificateUpload.findFirst({
                where: { id: match[1], userId },
                select: { id: true },
            });
            if (!certificate)
                throw new WorkflowError(
                    'Certificate does not belong to your account.',
                    403
                );
            certificateId = certificate.id;
        }
        return createPendingRoleRequest(
            {
                userId,
                fromRole: user.role,
                toRole: toRole as UserType,
                requestedMhpssLevel:
                    toRole === 'RESPONDER' ? (level as MhpssLevel) : null,
                requestedResponderOrganization:
                    toRole === 'RESPONDER' ? organization : null,
                requestedMhpssCertificateFileUrl: certificateId
                    ? certificatePath(certificateId)
                    : null,
                certificateId,
            },
            tx
        );
    });
}
export async function reviewRoleRequest(
    id: string,
    reviewerId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        const reviewer = await tx.user.findUnique({
            where: { id: reviewerId },
            select: { role: true, active: true },
        });
        if (reviewer?.role !== 'ADMIN' || !reviewer.active)
            throw new WorkflowError('Forbidden', 403);
        const request = await tx.roleChangeRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        });
        if (!request) throw new WorkflowError('Request not found.', 404);
        if (request.userId === reviewerId)
            throw new WorkflowError('You cannot review your own request.', 403);
        if (request.status !== 'PENDING')
            throw new WorkflowError('Request already reviewed.', 409);
        if (request.user.role !== request.fromRole)
            throw new WorkflowError(
                'The account role changed. Ask the user to submit a new request.',
                409
            );
        const changed = await tx.roleChangeRequest.updateMany({
            where: { id, status: 'PENDING' },
            data: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                reviewedAt: new Date(),
                reviewedById: reviewerId,
                rejectionReason:
                    action === 'REJECT'
                        ? reason?.trim().slice(0, 1000) || null
                        : null,
            },
        });
        if (!changed.count)
            throw new WorkflowError('Request already reviewed.', 409);
        if (action === 'APPROVE')
            await tx.user.update({
                where: { id: request.userId },
                data: {
                    role: request.toRole,
                    ...(request.toRole === 'RESPONDER'
                        ? {
                              mhpssLevel: request.requestedMhpssLevel,
                              responderOrganization:
                                  request.requestedResponderOrganization,
                              mhpssCertificateFileUrl:
                                  request.requestedMhpssCertificateFileUrl,
                          }
                        : {}),
                },
            });
        await tx.notification.create({
            data: {
                userId: request.userId,
                type: 'GENERAL',
                title:
                    action === 'APPROVE'
                        ? 'Role request approved'
                        : 'Role request rejected',
                message:
                    action === 'APPROVE'
                        ? 'Your account now has ' + request.toRole + ' access.'
                        : 'Your request was not approved.' +
                          (reason ? ' ' + reason.trim().slice(0, 1000) : ''),
                link: '/dashboard',
                refId: id,
                refType: 'RoleChangeRequest',
            },
        });
        const delivery = await enqueueEmail(
            tx,
            'role-review:' + id,
            action === 'APPROVE' ? 'ROLE_APPROVED' : 'ROLE_REJECTED',
            {
                userName: request.user.name,
                userEmail: request.user.email,
                newRole: request.toRole,
                toRole: request.toRole,
                reason,
            }
        );
        return { deliveryId: delivery.id };
    });
}
