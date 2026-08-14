import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

const MISALUDPage = async () => {
    const session = await auth();

    const role = session?.user?.role;

    if (!session || (role !== 'ADMIN' && role !== 'RESPONDER')) {
        redirect('/overview/misalud');
    }

    if (role === 'ADMIN') {
        redirect('/misalud/manage');
    }

    if (role === 'RESPONDER') {
        redirect('/misalud/team-requests');
    }
};

export default MISALUDPage;
