'use client';

import { useState, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
} from '@heroui/react';
import {
    UserCheck,
    Upload,
    X,
    AlertCircle,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import type { Session } from 'next-auth';

interface RoleRequestModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    session: Session;
    existingRequest?: {
        id: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
        toRole: string;
        createdAt?: string;
    } | null;
    onSuccess?: () => void;
}

const mhpssOptions = [
    { value: '1', label: 'Level 1 — Psychosocial Support' },
    { value: '2', label: 'Level 2 — Basic Psychological First Aid' },
    { value: '3', label: 'Level 3 — Counseling' },
    { value: '4', label: 'Level 4 — Clinical / Specialist' },
] as const;

const statusMeta = {
    PENDING: {
        icon: <Clock className="w-4 h-4" />,
        label: 'Pending Review',
        wrapperClass: 'bg-amber-50 border-amber-200 text-amber-800',
        description:
            'Your request is awaiting admin review. You will be notified by email.',
    },
    APPROVED: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Approved',
        wrapperClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        description: 'Your request was approved. Your role has been upgraded.',
    },
    REJECTED: {
        icon: <X className="w-4 h-4" />,
        label: 'Rejected',
        wrapperClass: 'bg-red-50 border-red-200 text-red-800',
        description:
            'Your request was rejected. You may submit a new request below.',
    },
    CANCELLED: {
        icon: <X className="w-4 h-4" />,
        label: 'Cancelled',
        wrapperClass: 'bg-slate-50 border-slate-200 text-slate-700',
        description: 'Your previous request was cancelled.',
    },
};

export default function RoleRequestModal({
    isOpen,
    onOpenChange,
    session,
    existingRequest,
    onSuccess,
}: RoleRequestModalProps) {
    const [organization, setOrganization] = useState('');
    const [mhpssLevel, setMhpssLevel] = useState<'' | '1' | '2' | '3' | '4'>(
        ''
    );
    const [certFile, setCertFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const wasRejected = existingRequest?.status === 'REJECTED';
    const showForm = (!existingRequest || wasRejected) && !success;

    const resetState = () => {
        setOrganization('');
        setMhpssLevel('');
        setCertFile(null);
        setError(null);
        setSuccess(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async () => {
        setError(null);

        if (!organization.trim()) {
            setError('Please enter your organization or affiliation.');
            return;
        }

        if (!certFile) {
            setError(
                'Please upload your certificate or proof of MHPSS Level. This is required.'
            );
            return;
        }

        try {
            setIsSubmitting(true);

            // ── Upload certificate ──────────────────────────────────────────
            const formData = new FormData();
            formData.append('file', certFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const j = await uploadRes.json().catch(() => null);
                throw new Error(j?.message || 'Certificate upload failed.');
            }

            const uploadData = await uploadRes.json();
            const certUrl: string | null = uploadData.url ?? null;

            // ── Submit role-change request ──────────────────────────────────
            const res = await fetch('/api/user/role-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toRole: 'RESPONDER',
                    requestedMhpssLevel: mhpssLevel
                        ? `LEVEL_${mhpssLevel}`
                        : null,
                    requestedResponderOrganization: organization.trim(),
                    requestedMhpssCertificateFileUrl: certUrl,
                }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success) {
                throw new Error(json?.message || 'Failed to submit request.');
            }

            setSuccess(true);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (isSubmitting) return;
                if (!open) resetState();
                onOpenChange(open);
            }}
            size="lg"
        >
            <ModalContent>
                {/* ── Header ────────────────────────────────────────────────── */}
                <ModalHeader className="flex items-center gap-2 font-black text-[#4A0707]">
                    <UserCheck className="w-5 h-5" />
                    Request Responder Role
                </ModalHeader>

                <ModalBody className="space-y-4">
                    {/* ── Existing request banner ───────────────────────────── */}
                    {existingRequest && !success && (
                        <div
                            className={`rounded-2xl p-4 border flex items-start gap-3 ${statusMeta[existingRequest.status].wrapperClass}`}
                        >
                            {statusMeta[existingRequest.status].icon}
                            <div className="text-sm">
                                <p className="font-semibold">
                                    {statusMeta[existingRequest.status].label}
                                </p>
                                <p className="opacity-80">
                                    {
                                        statusMeta[existingRequest.status]
                                            .description
                                    }
                                </p>
                                {existingRequest.createdAt && (
                                    <p className="opacity-60 text-xs mt-1">
                                        Submitted:{' '}
                                        {new Date(
                                            existingRequest.createdAt
                                        ).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Success state ─────────────────────────────────────── */}
                    {success && (
                        <div className="rounded-2xl p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-base">
                                    Request Submitted!
                                </p>
                                <p className="opacity-80 mt-1">
                                    An email has been sent to the DRRM-H admin
                                    team. You will receive a notification at{' '}
                                    <span className="font-medium">
                                        {session.user?.email}
                                    </span>{' '}
                                    once your request is reviewed.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Form ──────────────────────────────────────────────── */}
                    {showForm && (
                        <>
                            <p className="text-sm text-slate-600">
                                Submit a request to upgrade your account to{' '}
                                <span className="font-semibold text-[#7A0C1E]">
                                    Responder
                                </span>
                                . The admin team will review and notify you via
                                email.
                            </p>

                            {/* Organization */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                    Organization / Affiliation{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    placeholder="e.g. Red Cross, NDRRMC, LGU Pasig"
                                    value={organization}
                                    onValueChange={setOrganization}
                                    variant="bordered"
                                    isDisabled={isSubmitting}
                                    classNames={{
                                        inputWrapper:
                                            'border-[#A11B1B]/30 hover:border-[#A11B1B]/60 focus-within:border-[#A11B1B]',
                                    }}
                                />
                            </div>

                            {/* MHPSS Level (optional) */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                    MHPSS Level{' '}
                                    <span className="text-slate-400 font-normal normal-case">
                                        (optional)
                                    </span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {mhpssOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() =>
                                                setMhpssLevel((prev) =>
                                                    prev === opt.value
                                                        ? ''
                                                        : opt.value
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                mhpssLevel === opt.value
                                                    ? 'bg-gradient-to-r from-[#4A0707] to-[#A11B1B] text-white border-transparent shadow-md'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#A11B1B]/40'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Certificate upload — REQUIRED, mirrors RegisterForm style */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                    MHPSS Certificate / Proof{' '}
                                    <span className="text-red-500">*</span>
                                </label>

                                {/* Hidden native file input */}
                                <input
                                    ref={fileRef}
                                    id="roleRequestCertFile"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    disabled={isSubmitting}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        if (file) {
                                            if (file.type !== 'application/pdf') {
                                                setError('Only PDF files are accepted for the certificate.');
                                                if (fileRef.current) fileRef.current.value = '';
                                                return;
                                            }
                                            if (file.size > 5 * 1024 * 1024) {
                                                setError('Certificate file must be 5 MB or smaller.');
                                                if (fileRef.current) fileRef.current.value = '';
                                                return;
                                            }
                                        }
                                        setCertFile(file);
                                        if (error?.toLowerCase().includes('certificate') || error?.toLowerCase().includes('pdf') || error?.toLowerCase().includes('file must be')) {
                                            setError(null);
                                        }
                                    }}
                                />

                                {/*
                                 * Styled label — exact same pattern as RegisterForm.tsx:
                                 *   <label htmlFor="…"> with Upload icon + filename/placeholder
                                 *   + a "Choose File" / "Change" CTA on the right.
                                 * An X button lets the user clear the selection without
                                 * re-opening the file picker (it stops propagation so the
                                 * label click doesn't re-trigger the input).
                                 */}
                                <label
                                    htmlFor="roleRequestCertFile"
                                    className={`
                                        flex min-h-[52px] w-full cursor-pointer items-center
                                        justify-between rounded-2xl border px-5
                                        transition-all duration-200
                                        ${
                                            isSubmitting
                                                ? 'cursor-not-allowed opacity-50 border-slate-200 bg-slate-50'
                                                : certFile
                                                  ? 'border-[#A11B1B]/40 bg-[#A11B1B]/5 hover:border-[#A11B1B]/60'
                                                  : error
                                                          ?.toLowerCase()
                                                          .includes(
                                                              'certificate'
                                                          )
                                                    ? 'border-red-400 bg-red-50 hover:border-red-500'
                                                    : 'border-[#A11B1B]/30 bg-white hover:border-[#A11B1B]/60 hover:bg-[#A11B1B]/5'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Upload
                                            className={`h-5 w-5 shrink-0 ${
                                                certFile
                                                    ? 'text-[#7A0C1E]'
                                                    : error
                                                            ?.toLowerCase()
                                                            .includes(
                                                                'certificate'
                                                            )
                                                      ? 'text-red-400'
                                                      : 'text-slate-400'
                                            }`}
                                        />
                                        <span
                                            className={`truncate text-sm ${
                                                certFile
                                                    ? 'font-medium text-slate-800'
                                                    : error
                                                            ?.toLowerCase()
                                                            .includes(
                                                                'certificate'
                                                            )
                                                      ? 'text-red-400'
                                                      : 'text-slate-400'
                                            }`}
                                        >
                                            {certFile
                                                ? certFile.name
                                                : 'Upload Certificate / Proof of MHPSS Level'}
                                        </span>
                                    </div>

                                    <div className="ml-4 flex shrink-0 items-center gap-2">
                                        {certFile && (
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={(e) => {
                                                    // Prevent the label from re-opening the picker
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setCertFile(null);
                                                    if (fileRef.current)
                                                        fileRef.current.value =
                                                            '';
                                                }}
                                                className="rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                                                aria-label="Remove file"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                        <span className="text-sm font-semibold text-[#7A0C1E]">
                                            {certFile
                                                ? 'Change'
                                                : 'Choose File'}
                                        </span>
                                    </div>
                                </label>

                                <p className="px-1 text-xs text-slate-400">
                                    Accepted format: PDF only · Max size: 5 MB
                                </p>
                            </div>

                            {/* Error banner */}
                            {error && (
                                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </ModalBody>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <ModalFooter>
                    <Button
                        variant="light"
                        onPress={() => onOpenChange(false)}
                        isDisabled={isSubmitting}
                    >
                        {success ? 'Close' : 'Cancel'}
                    </Button>

                    {showForm && (
                        <Button
                            className="bg-gradient-to-r from-[#4A0707] via-[#6B0F0F] to-[#A11B1B] text-white font-semibold"
                            onPress={handleSubmit}
                            isLoading={isSubmitting}
                            startContent={
                                !isSubmitting && (
                                    <UserCheck className="w-4 h-4" />
                                )
                            }
                        >
                            Submit Request
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
