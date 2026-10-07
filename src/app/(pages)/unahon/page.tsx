import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Unahon from '@/components/unahon/Unahon';
import { auth } from '@/lib/auth';

const UnahonSummaryPage = async () => {
    const session = await auth();

    if (!session) {
        return <div className="p-6">Not authenticated.</div>;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'RESPONDER')
        redirect('/overview/unahon');
    return (
        <div>
            <Header session={session} />
            <Unahon session={session} />
        </div>
    );
};

export default UnahonSummaryPage;
