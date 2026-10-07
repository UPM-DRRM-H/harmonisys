'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/access';

export const savePlaceCoordinates = async (
    place: string,
    count: number,
    lat: number,
    lng: number
) => {
    try {
        await requireUser();
        await prisma.placeCoordinate.upsert({
            where: { place },
            update: { latitude: lat, longitude: lng, count },
            create: { place, latitude: lat, longitude: lng, count },
        });
    } catch (error) {
        console.error('Error saving place coordinates:', error);
    }
};

export const getAllPlaceCoordinates = async () => {
    try {
        await requireUser();
        const coordinates = await prisma.placeCoordinate.findMany();
        return coordinates;
    } catch (error) {
        console.error('Error fetching place coordinates:', error);
        return [];
    }
};
