'use client';

import { useState } from 'react';
import {
    Input,
    Button,
    Card,
    CardHeader,
    CardBody,
    DatePicker,
} from '@heroui/react';
import {
    Heart,
    Brain,
    Dumbbell,
    Smile,
    Activity,
    Salad,
    Moon,
    Sparkles,
    Users,
    Scale,
} from 'lucide-react';
import { QUESTIONS } from '@/constants/';
import type { QuestionnaireFormData, QuestionnaireResponses } from '@/types';
import { DateValue, CalendarDate } from '@internationalized/date';

interface QuestionnaireProps {
    scheduleId?: string;
    onClose?: () => void;
    openSuccessModal: () => void;
    approvedTeamName?: string;
    handleRecommendations: (
        responses: QuestionnaireResponses,
        formData: QuestionnaireFormData
    ) => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({
    onClose,
    openSuccessModal,
    approvedTeamName,
    scheduleId,
    handleRecommendations,
}) => {
    const [responses, setResponses] = useState<QuestionnaireResponses>({});
    const [formData, setFormData] = useState<QuestionnaireFormData>({
        name: '',
        date: new Date(),
        team: approvedTeamName || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<
        'idle' | 'success' | 'error'
    >('idle');

    const handleOptionChange = (questionId: number, option: string) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: option,
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDateChange = (value: DateValue | null) => {
        if (value) {
            const date = new Date(value.year, value.month - 1, value.day);
            setFormData((prev) => ({
                ...prev,
                date: date,
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            date: new Date(),
            team: approvedTeamName || '',
        });
        setResponses({});
    };

    const handleClose = () => {
        resetForm();
        setSubmitStatus('idle');
        onClose?.();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // Convert Date to ISO string for API submission
            const submissionData = {
                scheduleId,
                mode: scheduleId ? 'scheduled' : 'general',
                formData: {
                    ...formData,
                    date: formData.date.toISOString(),
                },
                responses,
            };

            const response = await fetch('/api/misalud/health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (response.ok) {
                setSubmitStatus('success');
                handleClose();
                openSuccessModal();
                handleRecommendations(responses, formData);
            } else {
                console.error('Submission error:', result.error);
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Network error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getWellnessIcon = (questionId: number) => {
        const icons = [
            Heart,
            Brain,
            Dumbbell,
            Smile,
            Activity,
            Salad,
            Moon,
            Sparkles,
            Users,
            Scale,
        ];
        const IconComponent = icons[questionId % icons.length] || Heart;
        return <IconComponent className="w-6 h-6 text-white" />;
    };

    return (
        <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Status Messages */}
                {submitStatus === 'error' && (
                    <Card className="border-l-4 border-red-500 bg-red-50">
                        <CardBody className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm text-red-700 font-medium">
                                    Error submitting health assessment. Please
                                    try again.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Personal Information Section */}
                <Card className="shadow-lg border border-emerald-200/70 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Personal Information
                        </h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                isRequired
                                name="name"
                                label="Full Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                isDisabled={isSubmitting}
                                variant="bordered"
                                className="font-medium"
                                classNames={{
                                    input: 'text-gray-900',
                                    label: 'text-gray-700 font-medium',
                                }}
                            />

                            <DatePicker
                                isRequired
                                name="date"
                                label="Assessment Date"
                                value={
                                    new CalendarDate(
                                        formData.date.getFullYear(),
                                        formData.date.getMonth() + 1,
                                        formData.date.getDate()
                                    )
                                }
                                onChange={handleDateChange}
                                maxValue={
                                    new CalendarDate(
                                        new Date().getFullYear(),
                                        new Date().getMonth() + 1,
                                        new Date().getDate()
                                    )
                                }
                                isDisabled={isSubmitting}
                                variant="bordered"
                                classNames={{
                                    input: 'text-gray-900',
                                    label: 'text-gray-700 font-medium',
                                }}
                            />
                        </div>

                        <div className="mt-6">
                            <Input
                                isRequired
                                name="team"
                                label="Team/Department"
                                value={formData.team}
                                isDisabled
                                variant="bordered"
                                description="This team is linked to your approved Mi Salud registration."
                                classNames={{
                                    input: 'text-gray-900',
                                    label: 'text-gray-700 font-medium',
                                }}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Health Assessment Questions */}
                {/* Health Assessment Questions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3 px-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        Wellness Assessment Questions
                    </h3>

                    <div className="space-y-6">
                        {QUESTIONS.map((q) => (
                            <Card
                                key={q.id}
                                className="border border-emerald-200/70 bg-white/85 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-200"
                            >
                                <CardBody className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div
                                            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                         bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500
                         shadow-md ring-1 ring-white/60"
                                        >
                                            {getWellnessIcon(q.id)}
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 text-base leading-relaxed">
                                                {q.id}. {q.text}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="space-y-3 ml-14">
                                        {q.options.map((opt, idx) => (
                                            <label
                                                key={idx}
                                                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/80 ${
                                                    responses[q.id] === opt
                                                        ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm'
                                                        : 'bg-white/50 border border-gray-200 hover:border-emerald-200'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${q.id}`}
                                                    value={opt}
                                                    checked={
                                                        responses[q.id] === opt
                                                    }
                                                    onChange={() =>
                                                        handleOptionChange(
                                                            q.id,
                                                            opt
                                                        )
                                                    }
                                                    required
                                                    className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 focus:ring-2"
                                                />
                                                <span className="text-gray-700 leading-relaxed font-medium">
                                                    {opt}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button
                        color="success"
                        type="submit"
                        isLoading={isSubmitting}
                        isDisabled={
                            isSubmitting ||
                            Object.keys(responses).length !== QUESTIONS.length
                        }
                        className="px-8 py-2 font-medium min-w-[180px] shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                    >
                        {isSubmitting
                            ? 'Processing Assessment...'
                            : 'Complete Assessment'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Questionnaire;
