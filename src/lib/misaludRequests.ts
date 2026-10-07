import { prisma } from '@/lib/prisma';
import { WorkflowError } from '@/lib/validation';
export async function createMiSaludRequest(
    userId: string,
    body: Record<string, unknown>
) {
    const fullName =
        typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const age = Number(body.age),
        role = body.requestedRole,
        teamName =
            typeof body.teamName === 'string' ? body.teamName.trim() : '';
    if (
        !fullName ||
        fullName.length > 200 ||
        !address ||
        address.length > 500 ||
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120 ||
        !['TEAM_LEADER', 'TEAM_MEMBER'].includes(role as string)
    )
        throw new WorkflowError(
            'Complete the membership details with a valid age and role.'
        );
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'misalud:' + userId}))`;
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (!user.active || user.role === 'STANDARD')
            throw new WorkflowError('Responder access is required.', 403);
        if (
            await tx.miSaludRequest.findFirst({
                where: { userId, status: 'PENDING' },
            })
        )
            throw new WorkflowError('You already have a pending request.', 409);
        let teamId: string | null = null,
            name = teamName,
            recipients: string[] = [];
        if (role === 'TEAM_LEADER') {
            if (!teamName || teamName.length > 150)
                throw new WorkflowError('Enter a team name.');
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'team:' + teamName.toLowerCase()}))`;
            if (
                (await tx.miSaludTeam.findFirst({
                    where: { name: { equals: teamName, mode: 'insensitive' } },
                })) ||
                (await tx.miSaludRequest.findFirst({
                    where: {
                        teamName: { equals: teamName, mode: 'insensitive' },
                        requestedRole: 'TEAM_LEADER',
                        status: 'PENDING',
                    },
                }))
            )
                throw new WorkflowError(
                    'Team name already exists or is pending.',
                    409
                );
            recipients = (
                await tx.user.findMany({
                    where: { role: 'ADMIN', active: true },
                    select: { id: true },
                })
            ).map((u) => u.id);
        } else {
            if (typeof body.teamId !== 'string')
                throw new WorkflowError('Choose an approved team.');
            const team = await tx.miSaludTeam.findFirst({
                where: { id: body.teamId, status: 'APPROVED' },
            });
            if (!team) throw new WorkflowError('Team is unavailable.');
            if (
                await tx.miSaludMembership.findFirst({
                    where: { userId, teamId: team.id, status: 'APPROVED' },
                })
            )
                throw new WorkflowError(
                    'You already belong to this team.',
                    409
                );
            teamId = team.id;
            name = team.name;
            recipients = [team.leaderUserId];
        }
        const request = await tx.miSaludRequest.create({
            data: {
                userId,
                fullName,
                address,
                age,
                requestedRole: role as 'TEAM_LEADER' | 'TEAM_MEMBER',
                teamName: name,
                teamId,
                reviewLevel: role === 'TEAM_LEADER' ? 'ADMIN' : 'TEAM_LEADER',
            },
        });
        if (recipients.length)
            await tx.notification.createMany({
                data: recipients.map((userId) => ({
                    userId,
                    type: 'MISALUD_NEW_REQUEST',
                    title:
                        role === 'TEAM_LEADER'
                            ? 'New team registration request'
                            : 'New team join request',
                    message: fullName + ' requested ' + name + '.',
                    link:
                        role === 'TEAM_LEADER'
                            ? '/misalud/manage'
                            : '/misalud/team-requests',
                    refId: request.id,
                    refType: 'MiSaludRequest',
                })),
            });
        return request;
    });
}
export async function reviewMiSaludRequest(
    id: string,
    reviewerId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'misalud-request:' + id}))`;
        const reviewer = await tx.user.findUniqueOrThrow({
            where: { id: reviewerId },
        });
        const request = await tx.miSaludRequest.findUnique({ where: { id } });
        if (!request) throw new WorkflowError('Request not found.', 404);
        if (
            !reviewer.active ||
            reviewer.role === 'STANDARD' ||
            request.userId === reviewerId
        )
            throw new WorkflowError('Forbidden', 403);
        if (request.status !== 'PENDING')
            throw new WorkflowError('Request already reviewed.', 409);
        const user = await tx.user.findUniqueOrThrow({
            where: { id: request.userId },
        });
        if (!user.active || user.role === 'STANDARD')
            throw new WorkflowError(
                'Requester no longer has Responder access.',
                409
            );
        if (request.reviewLevel === 'ADMIN') {
            if (
                reviewer.role !== 'ADMIN' ||
                request.requestedRole !== 'TEAM_LEADER'
            )
                throw new WorkflowError('Admin review required.', 403);
        } else {
            const membership = await tx.miSaludMembership.findFirst({
                where: {
                    userId: reviewerId,
                    teamId: request.teamId!,
                    role: 'TEAM_LEADER',
                    status: 'APPROVED',
                },
            });
            if (!membership || request.requestedRole !== 'TEAM_MEMBER')
                throw new WorkflowError(
                    'Only this team leader can review the request.',
                    403
                );
        }
        let team = request.teamId
            ? await tx.miSaludTeam.findUnique({ where: { id: request.teamId } })
            : null;
        let membership = null;
        if (action === 'APPROVE') {
            if (request.requestedRole === 'TEAM_LEADER')
                team = await tx.miSaludTeam.create({
                    data: {
                        name: request.teamName,
                        leaderUserId: request.userId,
                        status: 'APPROVED',
                        reviewedAt: new Date(),
                        reviewedById: reviewerId,
                    },
                });
            if (!team || team.status !== 'APPROVED')
                throw new WorkflowError('Team is unavailable.', 409);
            membership = await tx.miSaludMembership.upsert({
                where: {
                    userId_teamId: { userId: request.userId, teamId: team.id },
                },
                create: {
                    userId: request.userId,
                    teamId: team.id,
                    role: request.requestedRole,
                    status: 'APPROVED',
                    approvedAt: new Date(),
                },
                update: {
                    role: request.requestedRole,
                    status: 'APPROVED',
                    approvedAt: new Date(),
                },
            });
        }
        const updated = await tx.miSaludRequest.update({
            where: { id },
            data: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                reviewedById: reviewerId,
                reviewedAt: new Date(),
                teamId: team?.id || request.teamId,
                rejectionReason:
                    action === 'REJECT'
                        ? reason?.trim().slice(0, 1000) || null
                        : null,
            },
        });
        await tx.notification.create({
            data: {
                userId: request.userId,
                type:
                    request.requestedRole === 'TEAM_LEADER'
                        ? action === 'APPROVE'
                            ? 'MISALUD_TEAM_APPROVED'
                            : 'MISALUD_TEAM_REJECTED'
                        : action === 'APPROVE'
                          ? 'MISALUD_REQUEST_APPROVED'
                          : 'MISALUD_REQUEST_REJECTED',
                title:
                    action === 'APPROVE'
                        ? 'Mi Salud request approved'
                        : 'Mi Salud request rejected',
                message:
                    'Your request for ' +
                    request.teamName +
                    ' was ' +
                    (action === 'APPROVE' ? 'approved.' : 'rejected.'),
                link: '/misalud/team-requests',
                refId: id,
                refType: 'MiSaludRequest',
            },
        });
        return { success: true, request: updated, team, membership };
    });
}
