import { prisma } from '@/lib/prisma';
export async function archiveRecords(source: string, collection: string): Promise<Array<Record<string, unknown> & {id: string}>> {
    const records = await prisma.legacyDatasetRecord.findMany({
        where: { source, collection }, orderBy: { recordId: 'asc' },
    });
    return records.map(record => ({ ...(record.payload as Record<string, unknown>), id: record.recordId }));
}
export async function irsArchivedEvents() {
    const [events, categories, locations, scenarios] = await Promise.all([
        archiveRecords('irs', 'events'), archiveRecords('irs', 'event-categories'),
        archiveRecords('irs', 'event-locations'), archiveRecords('irs', 'event-scenarios'),
    ]);
    const lookup = (records: typeof events, id: unknown) => records.find(record => record.id === String(id));
    return events.map(event => ({ ...event, category: lookup(categories,event.categoryID),
        location: lookup(locations,event.locationID), scenario: lookup(scenarios,event.scenarioID) }));
}
