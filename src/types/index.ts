import {
    UserType,
    IncidentCategory,
    SeverityLevel,
    Incident,
} from '@prisma/client';

export interface AuthButtonProps {
    onPress: () => void;
}

// ... existing code ...

export interface CarouselItem {
    type: string;
    title: string;
    description: string;
    url: string;
    image?: string;
    icon?: string;
    bullets?: string[];
    relativePosition?: number;
    carouselIndex?: number;
}

// ... existing code ...
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    carouselItem?: CarouselItem;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserType;
    mhpssLevel: string | null;
    responderOrganization?: string | null;
    mhpssCertificateFileUrl?: string | null;
    gender?: string | null;
    region?: string | null;
    fullAddress?: string | null;
    createdAt: Date;
    pendingRoleRequest?: {
        id: string;
        toRole: UserType;
        requestedMhpssLevel?: string | null;
        requestedResponderOrganization?: string | null;
        requestedMhpssCertificateFileUrl?: string | null;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
        createdAt?: string;
    } | null;
}

export interface UserTableProps {
    results: User[];
    count: number;
}

// Re-export Prisma types for convenience
export type { Incident, IncidentCategory, SeverityLevel };

// Form-specific types for IRS
export interface IncidentFormData {
    location: string;
    date: Date;
    summary: string;
    description: string;
    category: string;
    otherCategoryDetail?: string;
    reporter?: string;
    contact?: string;
    teamDeployed: string;
    attachments?: FileList | null;
}

// Dashboard Types
export interface DashboardStats {
    overview: {
        totalUsers: number;
        totalIncidents: number;
        totalUnahonAssessments: number;
        totalQuestionnaires: number;
        totalIRSEvents: number;
        redasTrainingSessions: number;
    };
    recent: {
        recentIncidents: number;
        recentUnahonAssessments: number;
        recentSubmissions: number;
    };
    breakdown: {
        usersByRole: Record<string, number>;
        incidentsByCategory: Record<string, number>;
        incidentsBySeverity: Record<string, number>;
        unahonByType: Record<string, number>;
    };
    topResponders: Array<{ name: string; count: number }>;
    recentActivities: Array<{
        tool: string;
        action: string;
        timestamp: string;
        user: string;
        severity?: string;
    }>;
    system: {
        sources?: { irsEvents: string; redas: string };
        lastUpdated: string;
        status: string;
    };
}

export interface DashboardChartsData {
    monthlyTrends: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
        }>;
    };
    distributions: {
        severity: Array<{ name: string; value: number }>;
        category: Array<{ name: string; value: number }>;
        assessmentType: Array<{ name: string; value: number }>;
        userRole: Array<{ name: string; value: number }>;
    };
    topLocations: Array<{ name: string; value: number }>;
    recentActivity: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        timestamp: Date;
        severity?: string;
        tool: string;
    }>;
}

export interface RecentActivity {
    id: string;
    type: 'incident' | 'assessment' | 'questionnaire';
    title: string;
    description: string;
    timestamp: Date;
    severity?: string;
    tool: string;
}

export type colorTypes =
    | 'default'
    | 'danger'
    | 'warning'
    | 'primary'
    | 'success'
    | 'secondary'
    | undefined;

export * from './Unahon';
export * from './Redas';
export * from './MiSalud';
