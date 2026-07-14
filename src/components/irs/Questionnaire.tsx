'use client';

import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Button,
    Card,
    CardHeader,
    CardBody,
    DatePicker,
} from '@heroui/react';
import type { IncidentFormData } from '@/types';
import { IncidentCategory } from '@prisma/client';
import { useState, useEffect } from 'react';
import { DateValue, CalendarDate } from '@internationalized/date';
import { PhraseBank } from './PhraseBank';
import {
    validateIncidentAttachments,
    validateIncidentLocation,
} from '@/lib/irs/validation';

type Props = {
    onClose?: () => void;
    openSuccessModal: () => void;
};

const incidentCategories = [
    IncidentCategory.SAFETY_HAZARD,
    IncidentCategory.EQUIPMENT_MALFUNCTION,
    IncidentCategory.SECURITY_BREACH,
    IncidentCategory.NEAR_MISS,
    IncidentCategory.ENVIRONMENTAL_SPILL,
    IncidentCategory.OTHER,
];

// Helper function to convert enum values to display strings
const getCategoryDisplayName = (category: IncidentCategory): string => {
    const displayMap: Record<IncidentCategory, string> = {
        [IncidentCategory.SAFETY_HAZARD]: 'Safety Hazard',
        [IncidentCategory.EQUIPMENT_MALFUNCTION]: 'Equipment Malfunction',
        [IncidentCategory.SECURITY_BREACH]: 'Security Breach',
        [IncidentCategory.NEAR_MISS]: 'Near Miss',
        [IncidentCategory.ENVIRONMENTAL_SPILL]: 'Environmental Spill',
        [IncidentCategory.OTHER]: 'Other',
    };
    return displayMap[category];
};

const Questionnaire = ({ onClose, openSuccessModal }: Props) => {
    const [form, setForm] = useState<IncidentFormData>({
        location: '',
        date: new Date(),
        summary: '',
        description: '',
        category: '',
        reporter: '',
        contact: '',
        teamDeployed: '',
        otherCategoryDetail: '',
        attachments: null,
    });
    const [isLocating, setIsLocating] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<
        'idle' | 'success' | 'error'
    >('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [locationError, setLocationError] = useState<string>('');
    const [locationAutoLoadFailed, setLocationAutoLoadFailed] = useState(false);
    const [attachmentError, setAttachmentError] = useState<string>('');

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationAutoLoadFailed(true);
            setLocationError('Geolocation not supported by your browser.');
            return;
        }

        setIsLocating(true);
        setLocationError('');

        const timeoutId = setTimeout(() => {
            setIsLocating(false);
            setLocationAutoLoadFailed(true);
            setLocationError(
                'Location request timed out. Please enter a specific location manually (must include city).'
            );
        }, 10000);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                clearTimeout(timeoutId);
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        { headers: { 'Accept-Language': 'en' } }
                    );

                    if (!res.ok) throw new Error('Reverse geocode failed');

                    const data = await res.json();

                    if (data?.display_name) {
                        setForm((prev) => ({
                            ...prev,
                            location: data.display_name,
                        }));
                        setLocationAutoLoadFailed(false);
                    } else {
                        setForm((prev) => ({
                            ...prev,
                            location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
                        }));
                        setLocationAutoLoadFailed(true);
                        setLocationError(
                            'Could not resolve address. Please edit to include a city or municipality.'
                        );
                    }
                } catch (err) {
                    console.error('Reverse geocode error:', err);
                    setForm((prev) => ({
                        ...prev,
                        location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
                    }));
                    setLocationAutoLoadFailed(true);
                    setLocationError(
                        'Could not resolve address. Please edit to include a city or municipality.'
                    );
                } finally {
                    clearTimeout(timeoutId);
                    setIsLocating(false);
                }
            },
            (error) => {
                clearTimeout(timeoutId);
                setIsLocating(false);
                setLocationAutoLoadFailed(true);

                const messages: Record<number, string> = {
                    1: 'Location access denied. Please enter a specific location manually (must include city).',
                    2: 'Location unavailable. Please enter a specific location manually (must include city).',
                    3: 'Location request timed out. Please enter a specific location manually (must include city).',
                };
                setLocationError(
                    messages[error.code] ??
                        'Location failed. Please enter a specific location manually (must include city).'
                );
            },
            { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
        );
    }, []);

    const resetForm = () => {
        setForm({
            location: '',
            date: new Date(),
            summary: '',
            description: '',
            category: '',
            reporter: '',
            contact: '',
            teamDeployed: '',
            otherCategoryDetail: '',
            attachments: null,
        });
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        if (e.target.name === 'location') {
            setLocationAutoLoadFailed(false);
            if (!isLocating) {
                setLocationError('');
            }
        }

        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDateChange = (value: DateValue | null) => {
        if (value) {
            const date = new Date(value.year, value.month - 1, value.day);
            setForm((prev) => ({
                ...prev,
                date: date,
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            setForm({ ...form, attachments: null });
            setAttachmentError('');
            return;
        }

        const validation = validateIncidentAttachments(Array.from(files));
        if (!validation.valid) {
            setAttachmentError(validation.error ?? 'Invalid file.');
            e.target.value = '';
            setForm({ ...form, attachments: null });
            return;
        }

        setAttachmentError('');
        setForm({ ...form, attachments: files });
    };

    const handleOtherDetailChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setForm((prevForm) => ({
            ...prevForm,
            otherCategoryDetail: e.target.value,
        }));
    };

    const handleClose = () => {
        resetForm();
        setSubmitStatus('idle');
        setLocationAutoLoadFailed(false);
        setLocationError('');
        setAttachmentError('');
        onClose?.();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        const locationValidation = validateIncidentLocation(form.location, {
            autoLoadFailed: locationAutoLoadFailed,
        });

        if (!locationValidation.valid) {
            setSubmitStatus('error');
            setErrorMessage(
                locationValidation.error ??
                    'Please ensure your specific location includes a valid city.'
            );
            setIsSubmitting(false);
            return;
        }

        if (form.attachments) {
            const attachmentValidation = validateIncidentAttachments(
                Array.from(form.attachments)
            );
            if (!attachmentValidation.valid) {
                setSubmitStatus('error');
                setErrorMessage(
                    attachmentValidation.error ?? 'Invalid attachment.'
                );
                setIsSubmitting(false);
                return;
            }
        }

        const formData = new FormData();

        // Add all form fields to FormData
        Object.keys(form).forEach((key) => {
            const value = form[key as keyof typeof form];

            if (value !== undefined && value !== '') {
                if (key === 'attachments' && value instanceof FileList) {
                    Array.from(value).forEach((file) => {
                        formData.append('attachments', file);
                    });
                } else if (key === 'date' && value instanceof Date) {
                    // Convert Date to ISO string for API submission
                    formData.append(key, value.toISOString());
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        try {
            const response = await fetch('/api/irs/incidents', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setSubmitStatus('success');
                handleClose();
                openSuccessModal();
            } else {
                console.error('Submission error:', result.error);
                setSubmitStatus('error');
                setErrorMessage(
                    result.error ?? 'Submission failed. Please try again.'
                );
            }
        } catch (error) {
            console.error('Network error:', error);
            setSubmitStatus('error');
            setErrorMessage('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---- Design tokens (maroon theme, reuse everywhere) ----
    const sectionCard =
        'rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md ' +
        'shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_16px_35px_rgba(0,0,0,0.12)]';

    const sectionHeader = 'pb-2';
    const sectionTitle =
        'text-lg font-black text-[#7B122F] flex items-center gap-3';
    const sectionDot = 'w-2.5 h-2.5 bg-[#7B122F] rounded-full shadow-sm';
    const sectionUnderline = 'mt-2 h-[2px] w-20 bg-[#7B122F]/50 rounded-full';

    const commonField = {
        input: 'text-slate-900',
        label: 'text-slate-700 font-semibold',
        description: 'text-slate-500',
    };

    return (
        <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Information Section */}
                <Card className={sectionCard}>
                    <CardHeader className={sectionHeader}>
                        <div className="w-full">
                            <div className={sectionTitle}>
                                <div className={sectionDot} />
                                <div className="flex-1">
                                    <div>Basic Information</div>
                                    <div className={sectionUnderline} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className="pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                isRequired
                                name="location"
                                label="Specific Location"
                                value={
                                    isLocating
                                        ? 'Getting current location...'
                                        : form.location
                                }
                                onChange={handleChange}
                                isDisabled={isSubmitting || isLocating}
                                isInvalid={!!locationError && !isLocating}
                                description={
                                    locationError
                                        ? locationError
                                        : isLocating
                                          ? 'Auto-detecting your current location...'
                                          : 'Include a valid Philippine city or municipality (e.g., "UP Manila, Manila")'
                                }
                                variant="bordered"
                                className="font-medium"
                                classNames={commonField}
                            />

                            <DatePicker
                                isRequired
                                name="date"
                                label="Date of Incident"
                                value={
                                    new CalendarDate(
                                        form.date.getFullYear(),
                                        form.date.getMonth() + 1,
                                        form.date.getDate()
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
                                classNames={commonField}
                            />
                        </div>

                        <div className="mt-5">
                            <Input
                                isRequired
                                name="summary"
                                label="Incident Summary"
                                maxLength={150}
                                value={form.summary}
                                onChange={handleChange}
                                description={`${form.summary?.length || 0}/150 characters`}
                                isDisabled={isSubmitting}
                                variant="bordered"
                                classNames={commonField}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Incident Details Section */}
                <Card className={sectionCard}>
                    <CardHeader className={sectionHeader}>
                        <div className="w-full">
                            <div className={sectionTitle}>
                                <div className={sectionDot} />
                                <div className="flex-1">
                                    <div>Incident Details</div>
                                    <div className={sectionUnderline} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className="pt-1">
                        <div className="space-y-5">
                            <div>
                                <Textarea
                                    isRequired
                                    name="description"
                                    label="Detailed Description"
                                    placeholder="Please describe the incident in detail..."
                                    value={form.description}
                                    onChange={handleChange}
                                    isDisabled={isSubmitting}
                                    variant="bordered"
                                    minRows={4}
                                    classNames={commonField}
                                />
                                <PhraseBank
                                    onInsert={(phrase) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            description: prev.description
                                                ? prev.description.trimEnd() +
                                                  ' ' +
                                                  phrase
                                                : phrase,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Select
                                    label="Incident Category"
                                    isRequired
                                    selectedKeys={
                                        form.category ? [form.category] : []
                                    }
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(
                                            keys
                                        )[0] as string;
                                        setForm({
                                            ...form,
                                            category: selectedKey,
                                        });
                                    }}
                                    isDisabled={isSubmitting}
                                    variant="bordered"
                                    classNames={{
                                        label: commonField.label,
                                        value: 'text-slate-900',
                                    }}
                                >
                                    {incidentCategories.map((cat) => (
                                        <SelectItem key={cat}>
                                            {getCategoryDisplayName(
                                                cat as IncidentCategory
                                            )}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {(form.category as IncidentCategory) ===
                                    IncidentCategory.OTHER && (
                                    <Input
                                        label="Please Specify Category"
                                        placeholder="e.g., HVAC failure, Power outage, etc."
                                        isRequired
                                        value={form.otherCategoryDetail}
                                        onChange={handleOtherDetailChange}
                                        isDisabled={isSubmitting}
                                        variant="bordered"
                                        classNames={commonField}
                                    />
                                )}
                            </div>

                            <Input
                                isRequired
                                name="teamDeployed"
                                label="Team Deployed"
                                placeholder="e.g., Emergency Response Team, Security Team"
                                value={form.teamDeployed}
                                onChange={handleChange}
                                isDisabled={isSubmitting}
                                variant="bordered"
                                classNames={commonField}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Contact Information Section */}
                <Card className={sectionCard}>
                    <CardHeader className={sectionHeader}>
                        <div className="w-full">
                            <div className={sectionTitle}>
                                <div className={sectionDot} />
                                <div className="flex-1">
                                    <div>Contact Information</div>
                                    <div className={sectionUnderline} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className="pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                name="reporter"
                                label="Your Name (optional)"
                                value={form.reporter}
                                onChange={handleChange}
                                isDisabled={isSubmitting}
                                variant="bordered"
                                classNames={commonField}
                            />

                            <Input
                                name="contact"
                                label="Contact Info (optional)"
                                value={form.contact}
                                onChange={handleChange}
                                isDisabled={isSubmitting}
                                variant="bordered"
                                classNames={commonField}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Attachments Section */}
                <Card className={sectionCard}>
                    <CardHeader className={sectionHeader}>
                        <div className="w-full">
                            <div className={sectionTitle}>
                                <div className={sectionDot} />
                                <div className="flex-1">
                                    <div>Attachments</div>
                                    <div className={sectionUnderline} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className="pt-1">
                        <Card className="rounded-2xl border-2 border-dashed border-[#7B122F]/25 bg-white/55">
                            <CardBody className="p-5">
                                <Input
                                    name="attachments"
                                    type="file"
                                    label="Upload Files (optional)"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    isDisabled={isSubmitting}
                                    isInvalid={!!attachmentError}
                                    description={attachmentError || undefined}
                                    variant="bordered"
                                    classNames={commonField}
                                />

                                <p className="text-sm text-slate-500 mt-2">
                                    Supported formats: PDF, JPG, PNG, DOC, DOCX
                                    (Max 10MB per file)
                                </p>
                            </CardBody>
                        </Card>
                    </CardBody>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-1">
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        size="lg"
                        className="
                px-8 py-2 font-medium min-w-[180px] rounded-2xl
                bg-[#7B122F] text-white
                shadow-[0_12px_28px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.35)]
                hover:bg-[#651026] hover:shadow-[0_16px_35px_rgba(0,0,0,0.22),0_0_0_2px_rgba(255,255,255,0.45)]
                active:scale-[0.99]
                transition-all duration-200
                disabled:opacity-70 disabled:cursor-not-allowed
                "
                    >
                        {isSubmitting
                            ? 'Processing Report...'
                            : 'Submit Report'}
                    </Button>
                </div>
            </form>

            {submitStatus === 'error' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-600"
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

                            <h2 className="text-lg font-bold text-red-600">
                                Submission Error
                            </h2>
                        </div>

                        <p className="text-slate-700 mb-6">{errorMessage}</p>

                        <div className="flex justify-end">
                            <Button
                                className="bg-[#7B122F] text-white"
                                onClick={() => setSubmitStatus('idle')}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questionnaire;
