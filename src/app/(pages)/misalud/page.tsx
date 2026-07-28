import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import MiSalud from '@/components/misalud/MiSalud';
import { auth } from '@/lib/auth';

const MISALUDPage = async () => {
    const session = await auth();

    const role = session?.user?.role;

    if (!session || (role !== 'ADMIN' && role !== 'RESPONDER')) {
        redirect('/overview/misalud');
    }

    // Responders go straight to their Team Leader dashboard
    if (role === 'RESPONDER') {
        redirect('/misalud/team-requests');
    }

    // Admins see the full dashboard
    return (
        <div>
            <Header session={session} />
            <MiSalud userRole={role} />
        </div>
    );
};

export default MISALUDPage;
