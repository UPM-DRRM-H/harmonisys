'use server';

import { prisma } from '@/lib/prisma';
import { AssessmentType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { Checklist, ConfidentialForm, UnahonSummary } from '@/types';

interface FilterOptions {
    search?: string;
    assessmentType?: string;
    dateFilter?: string;
}

// Get Unahon forms categorized by client with filtering
export const getUnahonFormsGroupedByClient = async (
    page = 1,
    limit?: number,
    filters?: FilterOptions
): Promise<{
    count?: number;
    data?: {
        [client: string]: {
            id: string;
            confidentialForm: ConfidentialForm;
            checklist: Checklist;
            responder: string;
        }[];
    };
    error?: string;
}> => {
    try {
        const skip = limit ? (page - 1) * limit : 0;

        // Build where clause based on filters
        const whereClause: any = {};

        // Search filter
        if (filters?.search) {
            whereClause.OR = [
                {
                    client: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
                {
                    affiliation: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
                {
                    responder: {
                        name: {
                            contains: filters.search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        // Assessment type filter
        if (filters?.assessmentType && filters.assessmentType !== 'all') {
            if (
                Object.values(AssessmentType).includes(
                    filters.assessmentType as AssessmentType
                )
            ) {
                whereClause.assessmentType = filters.assessmentType;
            }
        }

        // Date filter
        if (filters?.dateFilter && filters.dateFilter !== 'all') {
            const now = new Date();
            let filterDate = new Date();
            switch (filters.dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    whereClause.date = {
                        gte: filterDate,
                    };
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    whereClause.date = {
                        gte: filterDate,
                    };
                    break;
                case 'month':
                    filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    whereClause.date = {
                        gte: filterDate,
                    };
                    break;
                case 'recent-7':
                    filterDate.setDate(now.getDate() - 7);
                    whereClause.date = {
                        gte: filterDate,
                    };
                    break;
                case 'last-30':
                    filterDate.setDate(now.getDate() - 30);
                    whereClause.date = {
                        gte: filterDate,
                    };
                    break;
            }
        }

        const unahonForms = await prisma.unahon.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            include: {
                checklist: true,
                responder: {
                    select: { name: true },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        // Grouping by client with the correct data structure
        const groupedByClient: {
            [client: string]: {
                id: string;
                confidentialForm: ConfidentialForm;
                checklist: Checklist;
                responder: string;
            }[];
        } = {};

        for (const form of unahonForms) {
            // Convert checklist data to the expected structure
            const checklistData: Checklist = {};

            for (const item of form.checklist) {
                if (!checklistData[item.category]) {
                    checklistData[item.category] = {};
                }
                checklistData[item.category][item.key] = [
                    item.agree,
                    item.disagree,
                ];
            }

            const confidentialForm: ConfidentialForm = {
                client: form.client,
                userId: form.userId,
                location: form.location || '',
                date: form.date,
                affiliation: form.affiliation,
                assessmentType: form.assessmentType,
                availablePatientIds: [],
            };

            if (!groupedByClient[form.client]) {
                groupedByClient[form.client] = [];
            }

            groupedByClient[form.client].push({
                id: form.id,
                confidentialForm,
                checklist: checklistData,
                responder: form.responder.name || 'Unknown',
            });
        }

        // Get total count with the same filters
        const totalForms = await prisma.unahon.count({
            where: whereClause,
        });

        return {
            count: totalForms,
            data: groupedByClient,
        };
    } catch (error) {
        console.error('Error fetching Unahon forms:', error);
        return { error: 'Failed to fetch Unahon forms' };
    }
};

// Save a new Unahon form
export const saveUnahonForm = async (data: {
    client: string;
    assessmentType: AssessmentType;
    userId: string;
    location: string;
    affiliation: string;
    date: Date;
    checklist: {
        [category: number]: { [key: number]: [a: boolean, b: boolean] };
    };
}) => {
    try {
        const result = await prisma.unahon.create({
            data: {
                client: data.client,
                userId: data.userId,
                location: data.location,
                affiliation: data.affiliation,
                date: data.date,
                assessmentType: data.assessmentType,
                checklist: {
                    create: Object.entries(data.checklist).flatMap(
                        ([category, questions]) =>
                            Object.entries(questions).map(
                                ([key, [agree, disagree]]) => ({
                                    category: Number(category),
                                    key: Number(key),
                                    agree,
                                    disagree,
                                })
                            )
                    ),
                },
            },
        });
        revalidatePath('/unahon');
        return result;
    } catch (error) {
        console.error('Error saving Unahon form:', error);
        throw new Error('Failed to save Unahon form');
    }
};

export const getUsedPatientIds = async () => {
    try {
        const records = await prisma.unahon.findMany({
            select: {
                client: true,
            },
        });

        return records
            .map((record) => record.client)
            .filter((client): client is string => Boolean(client));
    } catch (error) {
        console.error('Error fetching used patient IDs:', error);
        return [];
    }
};

export const getUnahonFormsSummary = async (): Promise<UnahonSummary> => {
    const unahonSummary = {
        redCount: 0,
        yellowCount: 0,
        greenCount: 0,
        noneCount: 0,
        initialAssessment: 0,
        reassessment: 0,
    };

    try {
        const unahonForms = await prisma.unahon.findMany({
            include: {
                checklist: true,
            },
        });

        for (const form of unahonForms) {
            let incremented = false;

            if (form.assessmentType === 'INITIAL_ASSESSMENT') {
                unahonSummary.initialAssessment++;
            } else if (form.assessmentType === 'RE_ASSESSMENT') {
                unahonSummary.reassessment++;
            }

            // unahonSections order (from @/constants):
            //   index 0 = green
            //   index 1 = yellow
            //   index 2 = red
            //
            // Sort descending (2 → 1 → 0) so red is evaluated first.
            // This ensures a form that triggered red is counted as red,
            // not accidentally counted as green just because its category 0
            // (green) item appears first in the DB result.
            const sortedChecklist = [...form.checklist].sort(
                (a, b) => b.category - a.category
            );

            for (const item of sortedChecklist) {
                if (item.agree && !item.disagree) {
                    switch (item.category) {
                        case 2:
                            // category 2 = red section (index 2 in unahonSections)
                            unahonSummary.redCount++;
                            break;
                        case 1:
                            // category 1 = yellow section
                            unahonSummary.yellowCount++;
                            break;
                        case 0:
                            // category 0 = green section
                            unahonSummary.greenCount++;
                            break;
                        default:
                            break;
                    }
                    incremented = true;
                    break; // stop at the first (highest-priority) triggered item
                }
            }

            if (!incremented) {
                unahonSummary.noneCount++;
            }
        }

        return unahonSummary;
    } catch (error) {
        console.error('Error fetching Unahon summary:', error);
        return unahonSummary;
    }
};
