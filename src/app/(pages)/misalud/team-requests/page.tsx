import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/Header';
import MiSaludLeaderDashboard from '@/components/misalud/MiSaludLeaderDashboard';
import MiSaludLeaderRequestsClient from '@/components/misalud/MiSaludLeaderRequestsClient';
import MiSaludMemberDashboard from '@/components/misalud/MiSaludMemberDashboard';
import MiSaludRegistrationGate from '@/components/misalud/MiSaludRegistrationGate';

const MiSaludTeamRequestsPage = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'RESPONDER' && session.user.role !== 'ADMIN') {
        redirect('/overview/misalud');
    }

    // Admins get the admin requests client
    if (session.user.role === 'ADMIN') {
        return (
            <div>
                <Header session={session} />
                <MiSaludLeaderRequestsClient session={session} />
            </div>
        );
    }

    // RESPONDER: check their membership status
    const membership = await prisma.miSaludMembership.findFirst({
        where: { userId: session.user.id, status: 'APPROVED' },
        orderBy: { updatedAt: 'desc' },
    });

    // Approved team member → member dashboard
    if (membership?.role === 'TEAM_MEMBER') {
        return (
            <div>
                <Header session={session} />
                <MiSaludMemberDashboard session={session} />
            </div>
        );
    }

    // Approved team leader → leader dashboard
    if (membership?.role === 'TEAM_LEADER') {
        return (
            <div>
                <Header session={session} />
                <MiSaludLeaderDashboard session={session} />
            </div>
        );
    }

    // No approved membership yet — show the registration gate
    // (covers: no request, pending, or rejected states)
    return (
        <div>
            <Header session={session} />
            <MiSaludRegistrationGate />
        </div>
    );
};

export default MiSaludTeamRequestsPage;
