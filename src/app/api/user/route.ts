import { withAccess } from '@/lib/apiAccess';
import { getAllUsers } from '@/lib/action/user';
import { NextResponse } from 'next/server';

async function handleGET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const users = await getAllUsers(pageNumber, limitNumber);

    if (users.error) {
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }

    return NextResponse.json(users);
}

export const GET = withAccess(handleGET, ['ADMIN']);
