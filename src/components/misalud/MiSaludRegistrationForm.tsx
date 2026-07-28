'use client';

import { useEffect, useState } from 'react';
import { Input, Button, Select, SelectItem } from '@heroui/react';

type TeamOption = {
    id: string;
    name: string;
};

type Props = {
    onSuccess?: () => void;
    onCancel?: () => void;
    defaultName?: string;
};

const misaludTheme = {
    primaryGradient: 'from-emerald-800 via-emerald-700 to-emerald-600',
    primaryHover: 'from-emerald-900 via-emerald-800 to-emerald-700',
};

const roleOptions = [
    { key: 'TEAM_LEADER', label: 'Team Leader' },
    { key: 'TEAM_MEMBER', label: 'Team Member' },
];

const MiSaludRegistrationForm = ({ onSuccess, onCancel, defaultName }: Props) => {
    const [fullName, setFullName] = useState(defaultName ?? '');
    const [age, setAge] = useState('');
    const [requestedRole, setRequestedRole] = useState<
        'TEAM_LEADER' | 'TEAM_MEMBER' | ''
    >('');
    const [teamName, setTeamName] = useState('');
    const [teamId, setTeamId] = useState('');
    const [approvedTeams, setApprovedTeams] = useState<TeamOption[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [teamNameError, setTeamNameError] = useState('');

    useEffect(() => {
        const fetchApprovedTeams = async () => {
            try {
                const res = await fetch('/api/misalud/teams/approved');
                if (!res.ok) return;

                const data = await res.json();
                setApprovedTeams(data.teams || []);
            } catch (error) {
                console.error('Error fetching approved teams:', error);
            }
        };

        fetchApprovedTeams();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            const payload = {
                fullName,
                age: Number(age),
                requestedRole,
                teamName:
                    requestedRole === 'TEAM_LEADER' ? teamName : undefined,
                teamId: requestedRole === 'TEAM_MEMBER' ? teamId : undefined,
            };

            const res = await fetch('/api/misalud/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit registration');
            }

            setSuccessMessage(
                data.message || 'Registration submitted successfully.'
            );

            setTimeout(() => {
                onSuccess?.();
            }, 1200);
        } catch (error) {
            console.error(error);
            setError(
                error instanceof Error ? error.message : 'Something went wrong.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Input
                label="Full Name"
                value={fullName}
                isDisabled
                variant="bordered"
                description="Pulled from your account profile."
            />

            <Input
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                isRequired
                variant="bordered"
                min={1}
            />

            <Select
                label="Position"
                selectedKeys={requestedRole ? [requestedRole] : []}
                onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as
                        | 'TEAM_LEADER'
                        | 'TEAM_MEMBER'
                        | undefined;

                    setRequestedRole(value || '');
                    setTeamName('');
                    setTeamId('');
                }}
                isRequired
                variant="bordered"
            >
                {roleOptions.map((role) => (
                    <SelectItem key={role.key}>{role.label}</SelectItem>
                ))}
            </Select>

            {requestedRole === 'TEAM_LEADER' && (
                <Input
                    label="Team/Department Name"
                    value={teamName}
                    onChange={(e) => {
                        const value = e.target.value;

                        setTeamName(value);

                        const exists = approvedTeams.some(
                            (team) =>
                                team.name.trim().toLowerCase() ===
                                value.trim().toLowerCase()
                        );

                        if (exists) {
                            setTeamNameError(
                                'Team/Department Name already exists or is taken.'
                            );
                        } else {
                            setTeamNameError('');
                        }
                    }}
                    isRequired
                    variant="bordered"
                    placeholder="Enter your new team or department name"
                    isInvalid={!!teamNameError}
                    errorMessage={teamNameError}
                />
            )}

            {requestedRole === 'TEAM_MEMBER' && (
                <Select
                    label="Team/Department"
                    selectedKeys={teamId ? [teamId] : []}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string | undefined;
                        setTeamId(value || '');
                    }}
                    isRequired
                    variant="bordered"
                >
                    {approvedTeams.map((team) => (
                        <SelectItem key={team.id}>{team.name}</SelectItem>
                    ))}
                </Select>
            )}

            {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            {successMessage && (
                <p className="text-sm text-emerald-600 font-medium">
                    {successMessage}
                </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="button"
                    onPress={onCancel}
                    isDisabled={isSubmitting}
                    className="
                        bg-white/70 text-emerald-800 font-medium
                        border border-emerald-200
                        hover:bg-emerald-50
                        transition-all duration-200
                    "
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!!teamNameError}
                    className={`
                        bg-gradient-to-r ${misaludTheme.primaryGradient}
                        text-white font-semibold
                        shadow-md
                        hover:shadow-lg
                        hover:brightness-110
                        transition-all duration-200
                    `}
                >
                    Submit Registration
                </Button>
            </div>
        </form>
    );
};

export default MiSaludRegistrationForm;
