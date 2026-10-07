'use client';
import { WellnessResponses } from '@/components/charts/ReadableCharts';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Skeleton,
} from '@heroui/react';
import { Button } from '@heroui/react';
import {
    ArrowLeft,
    Users,
    Calendar,
    TrendingUp,
    Activity,
    CheckCircle,
    AlertCircle,
    Clock,
    BarChart3,
    User,
    Target,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    Tooltip,
} from 'recharts';
import { QUESTIONS } from '@/constants/';
import { colorTypes } from '@/types';

interface QuestionnaireResponse {
    id: string;
    questionId: number;
    questionText: string;
    selectedOption: string;
    submissionId: string;
}

interface QuestionnaireSubmission {
    id: string;
    name: string;
    date: string;
    team: string;
    createdAt: string;
    updatedAt: string;
    responses: QuestionnaireResponse[];
}

interface QuestionnaireData {
    submissions: QuestionnaireSubmission[];
}

interface TeamPageProps {
    teamName: string;
}

const TeamDetailPage = ({ teamName }: TeamPageProps) => {
    const router = useRouter();

    const [questionnaireData, setQuestionnaireData] =
        useState<QuestionnaireData>({ submissions: [] });
    const [loading, setLoading] = useState(true);

    // Fetch questionnaire data
    const fetchQuestionnaireData = async () => {
        try {
            const response = await fetch('/api/misalud/health');
            if (!response.ok) {
                throw new Error('Failed to fetch questionnaire data');
            }
            const data = await response.json();
            setQuestionnaireData(data);
        } catch (error) {
            console.error('Error fetching questionnaire data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestionnaireData();
    }, []);

    // Filter submissions for this team
    const teamSubmissions = useMemo(() => {
        return questionnaireData.submissions.filter(
            (submission) => submission.team === teamName
        );
    }, [questionnaireData.submissions, teamName]);

    // Helper function to get response category based on option index
    const getResponseCategory = (
        questionId: number,
        selectedOption: string
    ): 'positive' | 'neutral' | 'negative' => {
        const question = QUESTIONS.find((q) => q.id === questionId);
        if (!question) return 'negative'; // Default to negative if question not found

        const optionIndex = question.options.indexOf(selectedOption);

        switch (optionIndex) {
            case 0:
                return 'positive'; // First option = positive
            case 1:
                return 'neutral'; // Second option = neutral
            case 2:
                return 'negative'; // Third option = negative
            default:
                return 'negative'; // Default to negative if option not found
        }
    };

    // Process data for charts
    const chartData = useMemo(() => {
        if (teamSubmissions.length === 0) return [];

        // Group responses by question
        const questionGroups: { [key: number]: QuestionnaireResponse[] } = {};

        teamSubmissions.forEach((submission) => {
            submission.responses.forEach((response) => {
                if (!questionGroups[response.questionId]) {
                    questionGroups[response.questionId] = [];
                }
                questionGroups[response.questionId].push(response);
            });
        });

        // Process each question's responses
        return Object.entries(questionGroups)
            .map(([questionId, responses]) => {
                const questionText =
                    responses[0]?.questionText || `Question ${questionId}`;

                // Categorize responses using dynamic logic
                let positive = 0;
                let neutral = 0;
                let negative = 0;

                responses.forEach((response) => {
                    const category = getResponseCategory(
                        response.questionId,
                        response.selectedOption
                    );

                    switch (category) {
                        case 'positive':
                            positive++;
                            break;
                        case 'neutral':
                            neutral++;
                            break;
                        case 'negative':
                            negative++;
                            break;
                    }
                });

                return {
                    question: `Q${questionId}`,
                    questionText,
                    positive,
                    neutral,
                    negative,
                    total: responses.length,
                };
            })
            .sort(
                (a, b) =>
                    Number.parseInt(a.question.slice(1)) -
                    Number.parseInt(b.question.slice(1))
            );
    }, [teamSubmissions]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getOverallHealthScore = () => {
        if (chartData.length === 0)
            return { score: 0, label: 'No Data', color: 'default' };

        const totalResponses = chartData.reduce(
            (sum, item) => sum + item.total,
            0
        );
        const positiveResponses = chartData.reduce(
            (sum, item) => sum + item.positive,
            0
        );

        const percentage = (positiveResponses / totalResponses) * 100;

        if (percentage >= 80)
            return { score: percentage, label: 'Excellent', color: 'success' };
        if (percentage >= 60)
            return { score: percentage, label: 'Good', color: 'primary' };
        if (percentage >= 40)
            return { score: percentage, label: 'Fair', color: 'warning' };
        return { score: percentage, label: 'Needs Attention', color: 'danger' };
    };

    const healthScore = getOverallHealthScore();

    // Custom tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Card className="p-3 shadow-lg border">
                    <CardBody className="p-0">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            <p className="font-semibold text-sm">{label}</p>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                            {data.questionText}
                        </p>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span className="text-xs text-green-600">
                                        Positive:
                                    </span>
                                </div>
                                <span className="text-xs font-medium">
                                    {data.positive}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                                    <span className="text-xs text-yellow-600">
                                        Neutral:
                                    </span>
                                </div>
                                <span className="text-xs font-medium">
                                    {data.neutral}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-red-600" />
                                    <span className="text-xs text-red-600">
                                        Needs Attention:
                                    </span>
                                </div>
                                <span className="text-xs font-medium">
                                    {data.negative}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-1">
                                <div className="flex items-center gap-1">
                                    <Target className="w-3 h-3 text-gray-600" />
                                    <span className="text-xs font-semibold">
                                        Total:
                                    </span>
                                </div>
                                <span className="text-xs font-semibold">
                                    {data.total}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Skeleton className="w-40 h-10 rounded-lg">
                                <div className="h-10"></div>
                            </Skeleton>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="w-8 h-8 rounded">
                                <div className="h-8"></div>
                            </Skeleton>
                            <Skeleton className="w-80 h-8 rounded-lg">
                                <div className="h-8"></div>
                            </Skeleton>
                        </div>
                        <Skeleton className="w-96 h-4 rounded-lg">
                            <div className="h-4"></div>
                        </Skeleton>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Card
                                key={index}
                                className="bg-gradient-to-r from-gray-50 to-gray-100"
                            >
                                <CardBody className="flex flex-row items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-lg">
                                        <div className="h-10"></div>
                                    </Skeleton>
                                    <div className="flex-1">
                                        <Skeleton className="w-24 h-3 rounded mb-1">
                                            <div className="h-3"></div>
                                        </Skeleton>
                                        <Skeleton className="w-16 h-6 rounded">
                                            <div className="h-6"></div>
                                        </Skeleton>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {/* Health Score Progress Skeleton */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-5 h-5 rounded">
                                    <div className="h-5"></div>
                                </Skeleton>
                                <Skeleton className="w-56 h-6 rounded-lg">
                                    <div className="h-6"></div>
                                </Skeleton>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <Skeleton className="w-full h-8 rounded-lg">
                                    <div className="h-8"></div>
                                </Skeleton>
                                <Skeleton className="w-96 h-4 rounded-lg">
                                    <div className="h-4"></div>
                                </Skeleton>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Chart Section Skeleton */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-5 h-5 rounded">
                                    <div className="h-5"></div>
                                </Skeleton>
                                <div>
                                    <Skeleton className="w-56 h-6 rounded-lg mb-2">
                                        <div className="h-6"></div>
                                    </Skeleton>
                                    <Skeleton className="w-96 h-4 rounded-lg">
                                        <div className="h-4"></div>
                                    </Skeleton>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <Skeleton className="w-full h-96 rounded-lg">
                                <div className="h-96"></div>
                            </Skeleton>
                        </CardBody>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 pt-6">
                    <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Team: {teamName} - Health Status
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Aggregated wellness data and response analysis
                            </p>
                        </div>

                        <Button
                            variant="solid"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                            startContent={<ArrowLeft className="w-4 h-4" />}
                            onPress={() => router.back()}
                        >
                            Back to MiSalud Dashboard
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Team Members
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {teamSubmissions.length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Responses
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {teamSubmissions.reduce(
                                        (sum, sub) =>
                                            sum + sub.responses.length,
                                        0
                                    )}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Health Score
                                </p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {healthScore.score.toFixed(0)}%
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <Chip
                                    size="sm"
                                    color={healthScore.color as colorTypes}
                                    variant="flat"
                                >
                                    {healthScore.label}
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Team Members List */}
                {teamSubmissions.length > 0 && (
                    <div className="mb-8">
                        <div className="mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Team Members & Recent Submissions
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {teamSubmissions.map((submission) => (
                                <Card
                                    key={submission.id}
                                    className="border border-emerald-100 shadow-sm hover:shadow-lg transition-shadow"
                                >
                                    <CardBody>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-emerald-600" />
                                                <h3 className="font-semibold text-gray-900">
                                                    {submission.name}
                                                </h3>
                                            </div>
                                            <Chip
                                                size="sm"
                                                color="success"
                                                variant="flat"
                                            >
                                                {submission.responses.length}{' '}
                                                responses
                                            </Chip>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Submitted:</span>
                                                </div>
                                                <span className="font-medium">
                                                    {formatDate(
                                                        submission.date
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Created:</span>
                                                </div>
                                                <span className="font-medium">
                                                    {formatDate(
                                                        submission.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Health Score Progress */}
                <Card className="mb-8 border border-emerald-100 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Overall Health Score
                            </h2>
                        </div>
                    </CardHeader>

                    <CardBody className="px-6 pb-6 pt-2">
                        <div className="w-full space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">
                                    Health Score
                                </span>

                                <span className="text-2xl font-bold text-emerald-700 leading-none">
                                    {healthScore.score.toFixed(0)}%
                                </span>
                            </div>

                            <Progress
                                size="lg"
                                value={healthScore.score}
                                color="success"
                                showValueLabel={false}
                                className="w-full"
                                aria-labelledby="progress"
                                aria-valuenow={healthScore.score}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />

                            <p className="pt-1 text-sm text-gray-600 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-600" />
                                Based on{' '}
                                {chartData.reduce(
                                    (sum, item) => sum + item.total,
                                    0
                                )}{' '}
                                total responses across {chartData.length}{' '}
                                questions
                            </p>
                        </div>
                    </CardBody>
                </Card>

                {/* Chart Section */}
                {chartData.length > 0 ? (
                    <Card className="mb-8">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-gray-600" />
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Health Status by Question
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Response distribution across all
                                        wellness questions
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="pt-6">
                            <div className="w-full min-w-0">
                                <WellnessResponses rows={chartData} />
                            </div>
                        </CardBody>
                    </Card>
                ) : (
                    <Card className="mb-8">
                        <CardBody className="text-center py-12">
                            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Data Available
                            </h3>
                            <p className="text-gray-500">
                                No questionnaire responses found for Team{' '}
                                {teamName}
                            </p>
                        </CardBody>
                    </Card>
                )}

                {/* Question Details */}
                {chartData.length > 0 && (
                    <div className="mb-8">
                        <div className="mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Detailed Question Analysis
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {chartData.map((item, index) => (
                                <Card
                                    key={index}
                                    className="border border-gray-200 shadow-sm"
                                >
                                    <CardBody>
                                        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-emerald-600" />
                                            {item.question}: {item.questionText}
                                        </h3>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {item.positive}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Positive
                                                </div>
                                                <Progress
                                                    size="sm"
                                                    value={
                                                        (item.positive /
                                                            item.total) *
                                                        100
                                                    }
                                                    color="success"
                                                    className="mt-2"
                                                    aria-labelledby="progress"
                                                    aria-valuenow={
                                                        (item.positive /
                                                            item.total) *
                                                        100
                                                    }
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                />
                                            </div>

                                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                    <div className="text-2xl font-bold text-yellow-600">
                                                        {item.neutral}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Neutral
                                                </div>
                                                <Progress
                                                    size="sm"
                                                    value={
                                                        (item.neutral /
                                                            item.total) *
                                                        100
                                                    }
                                                    color="warning"
                                                    className="mt-2"
                                                    aria-labelledby="progress"
                                                    aria-valuenow={
                                                        (item.neutral /
                                                            item.total) *
                                                        100
                                                    }
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                />
                                            </div>

                                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                    <div className="text-2xl font-bold text-red-600">
                                                        {item.negative}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Needs Attention
                                                </div>
                                                <Progress
                                                    size="sm"
                                                    value={
                                                        (item.negative /
                                                            item.total) *
                                                        100
                                                    }
                                                    color="danger"
                                                    className="mt-2"
                                                    aria-labelledby="progress"
                                                    aria-valuenow={
                                                        (item.negative /
                                                            item.total) *
                                                        100
                                                    }
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                />
                                            </div>

                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Target className="w-4 h-4 text-gray-600" />
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {item.total}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Total
                                                </div>
                                                <Progress
                                                    size="sm"
                                                    value={100}
                                                    color="default"
                                                    className="mt-2"
                                                    aria-labelledby="progress"
                                                    aria-valuenow={100}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailPage;
