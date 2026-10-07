'use client';
import type { AggregatedData } from '@/types/Redas';
import { ChartCard, CountBars } from '@/components/charts/ReadableCharts';
export default function ParticipantCharts({ data }: { data: AggregatedData }) {
    return (
        <div className="mb-8 grid gap-5 lg:grid-cols-2">
            <ChartCard
                title="Participants by reported gender"
                description="Percentages use the total participant count; unspecified entries are not shown."
            >
                <CountBars
                    data={[
                        { name: 'Male', value: data.totalMale },
                        { name: 'Female', value: data.totalFemale },
                    ]}
                    total={data.totalParticipants}
                    unit="participants"
                />
            </ChartCard>
            <ChartCard
                title="Participant groups"
                description="Group memberships may overlap. Percentages compare each group with all participants."
            >
                <CountBars
                    data={[
                        { name: 'Youth', value: data.totalYouth },
                        { name: 'Senior citizens', value: data.totalSC },
                        {
                            name: 'Persons with disabilities',
                            value: data.totalPWD,
                        },
                    ]}
                    total={data.totalParticipants}
                    unit="participants"
                />
            </ChartCard>
        </div>
    );
}
