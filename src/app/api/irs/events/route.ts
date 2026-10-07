import { withAccess } from '@/lib/apiAccess';
import { irsArchivedEvents } from '@/lib/legacyArchives';
import { NextResponse } from 'next/server';

interface Location {
    id: string;
    locationCode: string;
    locationName: string;
    isActive: boolean;
    locationDescription: string;
}
export interface Event {
    id: string;
    eventName: string;
    eventDescription: string;
    factSheet: string;
    status: string;
    eventStarted: boolean;
    eventDate: Date;
    scenarioID: string;
    locationID: string;
    categoryID: string;
    incidentCommanderID: string;
    liaisonOfficerID: string;
    publicInformationOfficerID: string;
    safetySecurityOfficerID: string;
    location: Location;
}

async function handleGET() {
    try {
        const events = await irsArchivedEvents();
        return NextResponse.json({message: events.length ? 'Ok' : 'No events found', data: events});
    } catch {
        return NextResponse.json({message:'Archive data is unavailable',data:null},{status:503});
    }
}
export const GET = withAccess(handleGET, ['ADMIN', 'RESPONDER']);
