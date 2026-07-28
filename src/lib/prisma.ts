import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Always reuse the singleton in development to prevent exhausting connections
// on hot reload. In production Next.js serverless each worker gets one instance.
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
