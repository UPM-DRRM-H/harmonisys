'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    DatePicker,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Skeleton,
    useDisclosure,
} from '@heroui/react';
import { CalendarClock, ClipboardList, Plus } from 'lucide-react';
import { CalendarDate, type DateValue } from '@internationalized/date';

type ScreeningType = 'PRE_DEPLOYMENT' | 'DURING_DEPLOYMENT' | 'POST_DEPLOYMENT';

type ScreeningSchedule = {
    id: string;
    screeningType: ScreeningType;
    validDate: string;
    dueDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
};

const SCREENING_TYPE_OPTIONS: { key: ScreeningType; label: string }[] = [
    { key: 'PRE_DEPLOYMENT', label: 'Pre-Deployment (Before operation)' },
    { key: 'DURING_DEPLOYMENT', label: 'During Deployment (Mid-shift/active operations)' },
    { key: 'POST_DEPLOYMENT', label: 'Post-Deployment (Post-operation/demobilization)' },
];

const SCREENING_TYPE_LABELS: Record<ScreeningType, string> = {
    PRE_DEPLOYMENT: 'Pre-Deployment',
    DURING_DEPLOYMENT: 'During Deployment',
    POST_DEPLOYMENT: 'Post-Deployment',
};

function addHours(date: Date, hours: number) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function toDatetimeLocalValue(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocalValue(value: string) {
    return new Date(value);
}

function dateValueToStartOfDay(value: DateValue) {
    return new Date(value.year, value.month - 1, value.day, 0, 0, 0, 0);
}

function dateToCalendarDate(date: Date) {
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function getScheduleWindowStatus(validDate: string, dueDate: string) {
    const now = Date.now();
    const validMs = new Date(validDate).getTime();
    const dueMs = new Date(dueDate).getTime();

    if (validMs > now) return 'pending' as const;
    if (dueMs > now) return 'active' as const;
    return 'expired' as const;
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function MiSaludScreeningScheduler() {
    const queryClient = useQueryClient();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const initialValidDate = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }, []);

    const [screeningType, setScreeningType] = useState<ScreeningType>('PRE_DEPLOYMENT');
    const [validDate, setValidDate] = useState<Date>(initialValidDate);
    const [dueDate, setDueDate] = useState<Date>(() => addHours(initialValidDate, 24));
    const [dueDateTouched, setDueDateTouched] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { data, isLoading } = useQuery<{ schedules: ScreeningSchedule[] }>({
        queryKey: ['misalud-leader-screenings'],
        queryFn: async () => {
            const res = await fetch('/api/misalud/leader/screenings');
            if (!res.ok) throw new Error('Failed to load screening schedules');
            return res.json();
        },
        staleTime: 60 * 1000,
    });

    const createSchedule = useMutation({
        mutationFn: async (payload: {
            screeningType: ScreeningType;
            validDate: string;
            dueDate: string;
        }) => {
            const res = await fetch('/api/misalud/leader/screenings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to create screening schedule');
            return result.schedule as ScreeningSchedule;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['misalud-leader-screenings'] });
            resetForm();
            onOpenChange(false);
        },
        onError: (error: Error) => {
            setFormError(error.message);
        },
    });

    const resetForm = () => {
        setScreeningType('PRE_DEPLOYMENT');
        setValidDate(initialValidDate);
        setDueDate(addHours(initialValidDate, 24));
        setDueDateTouched(false);
        setFormError(null);
    };

    useEffect(() => {
        if (!dueDateTouched) {
            setDueDate(addHours(validDate, 24));
        }
    }, [validDate, dueDateTouched]);

    const visibleSchedules = useMemo(() => {
        const schedules = data?.schedules ?? [];
        return schedules.filter((schedule) => {
            if (schedule.status !== 'ACTIVE') return false;
            return getScheduleWindowStatus(schedule.validDate, schedule.dueDate) !== 'expired';
        });
    }, [data?.schedules]);

    const handleValidDateChange = (value: DateValue | null) => {
        if (!value) return;
        setValidDate(dateValueToStartOfDay(value));
    };

    const handleSubmit = () => {
        setFormError(null);

        if (dueDate <= validDate) {
            setFormError('Due date must be after the valid date.');
            return;
        }

        createSchedule.mutate({
            screeningType,
            validDate: validDate.toISOString(),
            dueDate: dueDate.toISOString(),
        });
    };

    return (
        <>
            <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                <CardHeader className="px-6 pt-5 pb-2">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-black text-slate-800">Active Screening Schedules</h2>
                        {!isLoading && (
                            <Chip size="sm" color="primary" variant="flat">
                                {visibleSchedules.length}
                            </Chip>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="px-6 pb-5">
                    <p className="text-sm text-slate-500 mb-4">
                        Pending and active screening windows for your team, newest first.
                    </p>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((item) => (
                                <Skeleton key={item} className="h-20 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : visibleSchedules.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/60">
                            <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No pending or active screenings.</p>
                            <p className="text-sm mt-1">Use the + button to schedule a new screening window.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visibleSchedules.map((schedule) => {
                                const windowStatus = getScheduleWindowStatus(
                                    schedule.validDate,
                                    schedule.dueDate
                                );

                                return (
                                    <div
                                        key={schedule.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-800">
                                                        {SCREENING_TYPE_LABELS[schedule.screeningType]}
                                                    </p>
                                                    <Chip
                                                        size="sm"
                                                        color={windowStatus === 'active' ? 'success' : 'warning'}
                                                        variant="flat"
                                                    >
                                                        {windowStatus === 'active' ? 'Active' : 'Pending'}
                                                    </Chip>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Opens: {formatDateTime(schedule.validDate)}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    Locks: {formatDateTime(schedule.dueDate)}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Created {new Date(schedule.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>

            <Button
                isIconOnly
                aria-label="Create screening"
                onPress={onOpen}
                className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-700 transition-transform hover:scale-105"
            >
                <Plus className="w-6 h-6" />
            </Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={(open) => {
                    if (!open) resetForm();
                    onOpenChange(open);
                }}
                size="lg"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <span className="text-emerald-800">Create Screening</span>
                                <span className="text-sm font-normal text-slate-500">
                                    Schedule a 24-hour wellness screening window for your team.
                                </span>
                            </ModalHeader>
                            <ModalBody className="gap-5">
                                <Select
                                    label="Screening Type"
                                    selectedKeys={[screeningType]}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0] as ScreeningType | undefined;
                                        if (value) setScreeningType(value);
                                    }}
                                    variant="bordered"
                                    isDisabled={createSchedule.isPending}
                                >
                                    {SCREENING_TYPE_OPTIONS.map((option) => (
                                        <SelectItem key={option.key}>{option.label}</SelectItem>
                                    ))}
                                </Select>

                                <DatePicker
                                    label="Valid Date"
                                    description="The day the screening opens (24-hour active window)."
                                    value={dateToCalendarDate(validDate)}
                                    onChange={handleValidDateChange}
                                    variant="bordered"
                                    isDisabled={createSchedule.isPending}
                                    classNames={{
                                        input: 'text-gray-900',
                                        label: 'text-gray-700 font-medium',
                                    }}
                                />

                                <Input
                                    type="datetime-local"
                                    label="Due Date & Time"
                                    description="When the screening locks. Defaults to 24 hours after activation."
                                    value={toDatetimeLocalValue(dueDate)}
                                    onChange={(event) => {
                                        setDueDateTouched(true);
                                        setDueDate(parseDatetimeLocalValue(event.target.value));
                                    }}
                                    variant="bordered"
                                    isDisabled={createSchedule.isPending}
                                    classNames={{
                                        input: 'text-gray-900',
                                        label: 'text-gray-700 font-medium',
                                    }}
                                />

                                {formError && (
                                    <p className="text-sm text-red-600 font-medium">{formError}</p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose} isDisabled={createSchedule.isPending}>
                                    Cancel
                                </Button>
                                <Button
                                    color="success"
                                    className="bg-emerald-600 text-white"
                                    isLoading={createSchedule.isPending}
                                    onPress={handleSubmit}
                                >
                                    Create Screening
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
