'use client';

import { Button, useDisclosure, Card, CardBody, Skeleton } from '@heroui/react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unahonSections } from '@/constants';
import { AssessmentType } from '@prisma/client';
import UnahonConfidential from './UnahonConfidential';
import UnahonGuide from './UnahonGuide';
import type { UnahonProps, Row, ConfidentialForm } from '@/types';
import { saveUnahonForm } from '@/lib/action/unahon';
import { useRouter } from 'next/navigation';
import MHPSSLevel from '@/components/MHPSS';
import SuccessDialog from '../SuccessDialog';
import UnahonConfirmModal from './UnahonConfirmModal';

const CITY_CODE_MAP: Record<string, string> = {
    manila: 'MNL',
    'quezon city': 'QC',
    caloocan: 'CAL',
    makati: 'MKT',
    pasig: 'PSG',
    taguig: 'TGU',
    pasay: 'PSY',
    paranaque: 'PRQ',
    parañaque: 'PRQ',
    muntinlupa: 'MTP',
    'las pinas': 'LPN',
    'las piñas': 'LPN',
    marikina: 'MRK',
    mandaluyong: 'MDY',
    malabon: 'MLB',
    navotas: 'NVT',
    valenzuela: 'VLZ',
    'san juan': 'SNJ',
    cebu: 'CEB',
    'cebu city': 'CEB',
    davao: 'DAV',
    'davao city': 'DAV',
    iloilo: 'ILO',
    'iloilo city': 'ILO',
    baguio: 'BAG',
    bacolod: 'BCD',
    'cagayan de oro': 'CDO',
    zamboanga: 'ZAM',
};

const normalizeLocationText = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const buildLocationAcronym = (location?: string | null) => {
    if (!location) return 'UNK';

    const normalizedLocation = normalizeLocationText(location);

    const matchedEntry = Object.entries(CITY_CODE_MAP).find(([cityName]) =>
        normalizedLocation.includes(cityName)
    );

    if (matchedEntry) {
        return matchedEntry[1];
    }

    const parts = location
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    const fallbackPart = parts[parts.length - 1] || location;

    return (
        fallbackPart
            .replace(/[^a-zA-Z ]/g, '')
            .split(' ')
            .filter(Boolean)
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3) || 'UNK'
    );
};

const formatPatientDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
};

const shortenLocation = (result: any) => {
    const address = result?.address || {};

    const place =
        address.amenity ||
        address.building ||
        address.office ||
        address.attraction ||
        address.shop ||
        '';

    const district =
        address.suburb ||
        address.city_district ||
        address.neighbourhood ||
        address.quarter ||
        '';

    const city =
        address.city ||
        address.municipality ||
        address.town ||
        address.village ||
        '';

    const cleanedParts = [place, district, city].filter(Boolean);

    if (cleanedParts.length > 0) {
        return cleanedParts.join(', ');
    }

    const fullAddress = result?.display_name || '';
    if (!fullAddress) return '';

    return fullAddress.split(',').slice(0, 2).join(',').trim();
};

const reverseGeocode = async (lat: number, lng: number) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );

        return await response.json();
    } catch (error) {
        console.error('Error reverse geocoding location:', error);
        return null;
    }
};

const PATIENT_ID_PADDING = 5;
const PATIENT_ID_BATCH_SIZE = 10;

// Sentinel used while the real location is still being resolved via geolocation
const LOCATION_PENDING = '__PENDING__';

const generatePatientIdOptions = (
    location: string,
    date: Date,
    start = 1,
    count = PATIENT_ID_BATCH_SIZE,
    excludedIds: string[] = []
) => {
    const acronym = buildLocationAcronym(location);
    const formattedDate = formatPatientDate(date);
    const excludedSet = new Set(excludedIds);
    const generated: string[] = [];

    let sequenceNumber = start;

    while (generated.length < count) {
        const sequence = String(sequenceNumber).padStart(
            PATIENT_ID_PADDING,
            '0'
        );
        const candidate = `${acronym}-${formattedDate}-${sequence}`;

        if (!excludedSet.has(candidate)) {
            generated.push(candidate);
        }

        sequenceNumber += 1;
    }

    return generated;
};

const UnahonTable = dynamic(() => import('./UnahonTable'), {
    loading: () => (
        <div className="space-y-6">
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-[520px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
    ),
});

const Unahon: React.FC<UnahonProps> = ({
    session,
    isViewOnly,
    isReassessment,
    responder = session.user.name!,
    unahonChecklist,
    clientConfidentialForm,
    onReturnToManagement,
}) => {
    const router = useRouter();

    const buildInitialChecklist = () => {
        if (unahonChecklist) return unahonChecklist;

        const initialChecklist: {
            [category: number]: { [key: number]: [a: boolean, b: boolean] };
        } = {};

        unahonSections.forEach((section, section_index) => {
            initialChecklist[section_index] = {};
            section.questions.forEach((question: Row) => {
                initialChecklist[section_index][question.number] = [
                    false,
                    false,
                ];
            });
        });

        return initialChecklist;
    };

    const [checklist, setChecklist] = useState<{
        [category: number]: { [key: number]: [a: boolean, b: boolean] };
    }>(() => buildInitialChecklist());

    const [usedPatientIds, setUsedPatientIds] = useState<string[]>([]);

    const [confidentialForm, setConfidentialForm] = useState<ConfidentialForm>(
        () => {
            const initialDate = clientConfidentialForm?.date
                ? new Date(clientConfidentialForm.date)
                : new Date();

            // FIX: Use empty string instead of a placeholder text while location is resolving.
            // Generating an ID from "Detecting current location..." produces a meaningless acronym.
            // We use LOCATION_PENDING as a sentinel so downstream code knows to defer ID generation.
            const hasExplicitLocation = Boolean(
                clientConfidentialForm?.location
            );
            const initialLocation = hasExplicitLocation
                ? clientConfidentialForm!.location!
                : LOCATION_PENDING;

            // FIX: Only generate an initial client ID when we have a real location.
            // If location is pending (geolocation not yet resolved), leave client as empty
            // string and let the geolocation effect fill it in once the location resolves.
            const initialClient =
                clientConfidentialForm?.client ||
                (hasExplicitLocation
                    ? generatePatientIdOptions(
                          initialLocation,
                          initialDate,
                          1,
                          1,
                          []
                      )[0]
                    : '');

            const generatedOptions = hasExplicitLocation
                ? generatePatientIdOptions(
                      initialLocation,
                      initialDate,
                      1,
                      PATIENT_ID_BATCH_SIZE,
                      []
                  )
                : [];

            return {
                client: initialClient,
                userId: session.user.id!,
                location: hasExplicitLocation ? initialLocation : '',
                date: initialDate,
                affiliation:
                    clientConfidentialForm?.affiliation ||
                    session.user.responderOrganization ||
                    '',
                assessmentType:
                    clientConfidentialForm?.assessmentType ||
                    AssessmentType.INITIAL_ASSESSMENT,
                availablePatientIds: generatedOptions,
                ...(clientConfidentialForm ?? {}),
            };
        }
    );

    const [isLoading, setIsLoading] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);

    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const assessmentTopRef = useRef<HTMLDivElement | null>(null);
    const previousIndexRef = useRef<number | null>(null);
    const hasMountedRef = useRef(false);

    const goToPreviousSection = useCallback(() => {
        if (currentIndex === unahonSections.length) {
            setCurrentIndex(unahonSections.length - 1);
        } else {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? unahonSections.length - 1 : prevIndex - 1
            );
        }
    }, [currentIndex]);

    const goToNextSection = useCallback(() => {
        if (currentIndex === unahonSections.length - 1) {
            setCurrentIndex(unahonSections.length);
        } else {
            setCurrentIndex((prevIndex) =>
                prevIndex === unahonSections.length - 1 ? 0 : prevIndex + 1
            );
        }
    }, [currentIndex]);

    const goToConfidentialPage = () => {
        setCurrentIndex(unahonSections.length);
    };

    const handleExitAssessment = () => {
        if (onReturnToManagement) {
            onReturnToManagement();
        } else {
            router.push('/unahon');
        }
    };

    const handleSubmit = async () => {
        setSubmissionError(null);
        try {
            await saveUnahonForm({
                ...confidentialForm,
                assessmentType: isReassessment
                    ? AssessmentType.RE_ASSESSMENT
                    : confidentialForm.assessmentType,
                checklist,
            });
            setShowSuccessDialog(true);
        } catch (error) {
            setSubmissionError(
                error instanceof Error
                    ? error.message
                    : 'Assessment was not saved. Please retry.'
            );
            setShowSuccessDialog(true);
        }
    };

    const handleOpenConfirmModal = () => {
        console.log('Opening confirm modal');
        setShowConfirmModal(true);
    };

    const handleCloseConfirmModal = () => {
        setShowConfirmModal(false);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmModal(false);
        await handleSubmit();
    };

    // Fetch used patient IDs from the server on mount
    useEffect(() => {
        const fetchUsedPatientIds = async () => {
            try {
                const response = await fetch('/api/unahon/used-ids');
                const data = await response.json();
                setUsedPatientIds(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching used patient IDs:', error);
                setUsedPatientIds([]);
            }
        };

        fetchUsedPatientIds();
    }, []);

    // FIX: Once usedPatientIds loads, regenerate the client ID — but only when:
    //   1. No explicit client was provided via clientConfidentialForm, AND
    //   2. We already have a real resolved location (not pending/empty)
    useEffect(() => {
        if (!usedPatientIds.length) return;
        if (clientConfidentialForm?.client) return;

        setConfidentialForm((prevForm) => {
            // If location is still pending or empty, skip regeneration.
            // The geolocation effect will handle it once the location resolves.
            if (!prevForm.location || prevForm.location === LOCATION_PENDING) {
                return prevForm;
            }

            const nextClient = generatePatientIdOptions(
                prevForm.location,
                new Date(prevForm.date),
                1,
                1,
                usedPatientIds
            )[0];

            return {
                ...prevForm,
                client: nextClient,
                availablePatientIds: generatePatientIdOptions(
                    prevForm.location,
                    new Date(prevForm.date),
                    1,
                    PATIENT_ID_BATCH_SIZE,
                    usedPatientIds
                ),
            };
        });
    }, [usedPatientIds, clientConfidentialForm?.client]);

    // Sync checklist and confidentialForm when props change (e.g. view-only mode)
    useEffect(() => {
        if (unahonChecklist) {
            setChecklist(unahonChecklist);
        }

        if (clientConfidentialForm) {
            const location = clientConfidentialForm.location || '';

            const date = clientConfidentialForm.date
                ? new Date(clientConfidentialForm.date)
                : new Date();

            setConfidentialForm((prevForm) => ({
                ...prevForm,
                ...clientConfidentialForm,
                location,
                date,
                affiliation:
                    clientConfidentialForm.affiliation ||
                    session.user.responderOrganization ||
                    '',
                availablePatientIds:
                    clientConfidentialForm.availablePatientIds ||
                    (location
                        ? generatePatientIdOptions(
                              location,
                              date,
                              1,
                              PATIENT_ID_BATCH_SIZE,
                              usedPatientIds
                          )
                        : []),
            }));
        }
    }, [
        unahonChecklist,
        clientConfidentialForm,
        session.user.responderOrganization,
        usedPatientIds,
    ]);

    // Resolve the device's current location via geolocation and update the form.
    // FIX: Only runs when no explicit location was provided. Once resolved, generates
    // a proper patient ID based on the real location (not a placeholder string).
    useEffect(() => {
        if (clientConfidentialForm?.location) return;
        if (typeof window === 'undefined' || !navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const reverseGeocodeResult = await reverseGeocode(lat, lng);
                const resolvedLocation =
                    shortenLocation(reverseGeocodeResult) ||
                    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                setConfidentialForm((prevForm) => {
                    const currentDate = prevForm.date
                        ? new Date(prevForm.date)
                        : new Date();

                    // FIX: Only overwrite the client ID if one hasn't already been
                    // explicitly provided. If it was already set (e.g. via clientConfidentialForm),
                    // preserve it.
                    const shouldUpdateClient = !clientConfidentialForm?.client;

                    return {
                        ...prevForm,
                        location: resolvedLocation,
                        ...(shouldUpdateClient
                            ? {
                                  client: generatePatientIdOptions(
                                      resolvedLocation,
                                      currentDate,
                                      1,
                                      1,
                                      usedPatientIds
                                  )[0],
                                  availablePatientIds: generatePatientIdOptions(
                                      resolvedLocation,
                                      currentDate,
                                      1,
                                      PATIENT_ID_BATCH_SIZE,
                                      usedPatientIds
                                  ),
                              }
                            : {}),
                    };
                });
            },
            (error) => {
                console.error('Error getting current location:', error);
                // FIX: On geolocation failure, fall back to a generic location so
                // the patient ID can still be generated rather than staying blank.
                setConfidentialForm((prevForm) => {
                    if (
                        prevForm.location &&
                        prevForm.location !== LOCATION_PENDING
                    ) {
                        return prevForm; // already resolved, nothing to do
                    }

                    const fallbackLocation = 'Unknown';
                    const currentDate = prevForm.date
                        ? new Date(prevForm.date)
                        : new Date();

                    return {
                        ...prevForm,
                        location: fallbackLocation,
                        client: generatePatientIdOptions(
                            fallbackLocation,
                            currentDate,
                            1,
                            1,
                            usedPatientIds
                        )[0],
                        availablePatientIds: generatePatientIdOptions(
                            fallbackLocation,
                            currentDate,
                            1,
                            PATIENT_ID_BATCH_SIZE,
                            usedPatientIds
                        ),
                    };
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientConfidentialForm?.location]);

    useEffect(() => {
        if (isLoading) return;

        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            previousIndexRef.current = currentIndex;
            return;
        }

        if (previousIndexRef.current !== currentIndex) {
            assessmentTopRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }

        previousIndexRef.current = currentIndex;
    }, [currentIndex, isLoading]);

    const handleChecklistChange = (rowNumber: number, column: number) => {
        setChecklist((prev) => ({
            ...prev,

            [currentIndex]: {
                ...prev[currentIndex],
                [rowNumber]:
                    column === 0
                        ? [!prev[currentIndex][rowNumber][0], false]
                        : [false, !prev[currentIndex][rowNumber][1]],
            },
        }));
    };

    const handleConfidentialFormChange = (id: string, value: any) => {
        setConfidentialForm((prevData) => {
            const updatedData = { ...prevData, [id]: value };

            if (id === 'date' || id === 'location') {
                const nextLocation =
                    id === 'location' ? value : prevData.location;
                const nextDate =
                    id === 'date' ? new Date(value) : new Date(prevData.date);

                // FIX: Guard against generating an ID from an empty/pending location
                // when the user manually edits the date before the location resolves.
                if (nextLocation && nextLocation !== LOCATION_PENDING) {
                    const nextClient = generatePatientIdOptions(
                        nextLocation,
                        nextDate,
                        1,
                        1,
                        usedPatientIds
                    )[0];

                    updatedData.client = nextClient;
                    updatedData.availablePatientIds = generatePatientIdOptions(
                        nextLocation,
                        nextDate,
                        1,
                        PATIENT_ID_BATCH_SIZE,
                        usedPatientIds
                    );
                }

                return updatedData;
            }

            return updatedData;
        });
    };

    const isNextButtonDisabled = useCallback(() => {
        if (isViewOnly) return false;
        if (!checklist[currentIndex]) return true;

        const currentSectionQuestions = unahonSections[currentIndex].questions;

        const allDisagreeChecked = currentSectionQuestions.every(
            (question: Row) => {
                return checklist[currentIndex][question.number][1] === true;
            }
        );

        return !allDisagreeChecked;
    }, [checklist, currentIndex, isViewOnly]);

    const isPreviousButtonDisabled = useCallback(() => {
        if (isViewOnly) return false;
        return currentIndex === 0;
    }, [currentIndex, isViewOnly]);

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 lg:px-6 py-8 max-w-[1400px]">
                {/* Header Section */}
                <div className="mb-2 py-4 lg:py-6">
                    {isViewOnly && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
                            <p className="text-xl font-bold text-red-600 text-center flex items-center justify-center gap-2">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                                VIEW ONLY MODE
                            </p>
                        </div>
                    )}

                    {isReassessment && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                            <p className="text-xl font-bold text-blue-600 text-center flex items-center justify-center gap-2">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                REASSESSMENT MODE
                            </p>
                        </div>
                    )}

                    <div className="text-center">
                        <div className="max-w-[1320px] mx-auto">
                            <div className="flex justify-center items-center mb-3 py-1">
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-red-700 leading-[1.15] pb-1">
                                    UN<span className="italic">AHON</span>
                                </h1>
                            </div>

                            <h2 className="text-lg sm:text-xl lg:text-[2rem] font-bold text-slate-800 leading-tight tracking-tight max-w-6xl mx-auto mt-2 whitespace-nowrap">
                                BEHAVIOR OBSERVATION CHECKLIST FOR RESOURCE
                                PRIORITIZATION
                            </h2>

                            <div className="mt-10 max-w-[1320px] mx-auto space-y-5 text-slate-700">
                                <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm rounded-2xl">
                                    <CardBody className="p-4 sm:p-5 lg:p-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center self-center rounded-xl bg-blue-100 text-blue-700 shadow-sm">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm sm:text-base leading-relaxed text-slate-800">
                                                    Isa itong gamit upang
                                                    mahanap ang
                                                    pinakanangangailangan ng
                                                    serbisyo sa mga evacuation
                                                    camps.{' '}
                                                    <span className="font-bold text-red-600 underline decoration-red-300 underline-offset-2">
                                                        Hindi ito gagamiting
                                                        pangtukoy ng mga
                                                        sakit-pangkaisipan
                                                    </span>
                                                    .
                                                </p>

                                                <p className="text-xs sm:text-sm italic leading-relaxed text-slate-600">
                                                    (This is a tool that seeks
                                                    to prioritize resources in
                                                    cases wherein there is a
                                                    great demand that exceeds
                                                    current resources at
                                                    evacuation camps.{' '}
                                                    <span className="font-bold underline underline-offset-2">
                                                        This is not a diagnostic
                                                        tool
                                                    </span>
                                                    .)
                                                </p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm rounded-2xl">
                                    <CardBody className="p-4 sm:p-5 lg:p-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center self-center rounded-xl bg-amber-100 text-amber-700 shadow-sm">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm sm:text-base leading-relaxed text-slate-800">
                                                    Ibatay ang sagot sa mga
                                                    naobserbahang kilos.{' '}
                                                    <span className="font-bold text-red-600 underline decoration-red-300 underline-offset-2">
                                                        Huwag tuwirang itanong
                                                        ang mga ito sa mga
                                                        Internally Displaced
                                                        Persons o IDP
                                                    </span>
                                                    . Sagutan ang mga aytem nang
                                                    sunod-sunod mula sa itaas
                                                    hanggang sa ibaba. Kung OO
                                                    ang sagot sa isa sa mga
                                                    aytem, HUMINTO at isagawa
                                                    ang interbensyon.
                                                </p>

                                                <p className="text-xs sm:text-sm italic leading-relaxed text-slate-600">
                                                    (Base the answers on
                                                    observable behaviors.{' '}
                                                    <span className="font-bold underline underline-offset-2">
                                                        Do not directly ask
                                                        these questions to the
                                                        internally displaced
                                                        person (IDP)
                                                    </span>
                                                    . Answer the items in order
                                                    from top to bottom. If you
                                                    answered YES to any of the
                                                    items, STOP and do the
                                                    intervention.)
                                                </p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div ref={assessmentTopRef} className="mb-4 px-2 mt-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 lg:ml-3 mb-6 lg:mb-0">
                            <Button
                                onPress={onOpen}
                                className="font-semibold bg-gradient-to-r from-red-700 to-red-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                size="lg"
                                startContent={
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                }
                            >
                                MHPSS Level Legend
                            </Button>

                            <Button
                                onPress={handleExitAssessment}
                                variant="bordered"
                                className="font-semibold border-2 border-red-300 text-red-700 hover:bg-red-50 transition-all duration-300"
                                size="lg"
                                startContent={
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                }
                            >
                                Exit Assessment
                            </Button>
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex items-center gap-3 lg:mr-3">
                            <span className="text-sm font-medium text-slate-600">
                                Progress:
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            isReassessment
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                        }`}
                                        style={{
                                            width: `${((currentIndex + 1) / (unahonSections.length + 1)) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                    {currentIndex + 1}/
                                    {unahonSections.length + 1}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20">
                    <CardBody className="p-6">
                        {!isLoading ? (
                            currentIndex < unahonSections.length ? (
                                <div className="w-full overflow-x-auto">
                                    <UnahonTable
                                        isViewOnly={isViewOnly}
                                        index={currentIndex}
                                        key={currentIndex}
                                        checklist={checklist}
                                        handleChecklistChange={
                                            handleChecklistChange
                                        }
                                        competency={
                                            session.user.mhpssLevel ??
                                            session.user.competency ??
                                            null
                                        }
                                        goToConfidentialPage={
                                            goToConfidentialPage
                                        }
                                    />
                                </div>
                            ) : (
                                <UnahonConfidential
                                    isViewOnly={isViewOnly}
                                    isReassessment={isReassessment}
                                    confidentialForm={confidentialForm}
                                    handleConfidentialFormChange={
                                        handleConfidentialFormChange
                                    }
                                    responder={responder}
                                />
                            )
                        ) : (
                            <div className="space-y-6">
                                {/* Skeleton for table header */}
                                <div className="flex gap-4 pb-4 border-b border-slate-200">
                                    {[120, 100, 140, 90, 110].map(
                                        (width, index) => (
                                            <Skeleton
                                                key={index}
                                                className="h-6 rounded-lg"
                                                style={{ width: `${width}px` }}
                                            ></Skeleton>
                                        )
                                    )}
                                </div>

                                {/* Skeleton for table rows */}
                                {Array.from({ length: 8 }).map(
                                    (_, rowIndex) => (
                                        <div
                                            key={rowIndex}
                                            className="space-y-4 py-4 border-b border-slate-100"
                                        >
                                            <div className="flex gap-4 items-start">
                                                <Skeleton className="w-8 h-6 rounded-lg flex-shrink-0"></Skeleton>
                                                <div className="flex-1">
                                                    <Skeleton className="w-full h-6 rounded-lg mb-2"></Skeleton>
                                                    <Skeleton className="w-3/4 h-4 rounded-lg"></Skeleton>
                                                </div>
                                            </div>

                                            <div className="flex gap-8 ml-12">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-4 h-4 rounded"></Skeleton>
                                                    <Skeleton className="w-16 h-4 rounded-lg"></Skeleton>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-4 h-4 rounded"></Skeleton>
                                                    <Skeleton className="w-20 h-4 rounded-lg"></Skeleton>
                                                </div>
                                            </div>

                                            <div className="ml-12">
                                                <Skeleton className="w-full h-8 rounded-lg"></Skeleton>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Navigation Controls */}
                <Card className="mb-16 bg-transparent shadow-none border-none">
                    <CardBody className="pt-2 pb-2 px-0 overflow-visible">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            {/* Exit Assessment Button - Leftmost */}
                            <Button
                                onPress={handleExitAssessment}
                                variant="bordered"
                                className="font-semibold border-2 border-red-300 text-red-700 hover:bg-red-50 transition-all duration-300 mb-3 sm:mb-0"
                                size="lg"
                                startContent={
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                }
                            >
                                Exit Assessment
                            </Button>

                            {/* Navigation Buttons - Right side */}
                            <div className="flex gap-4">
                                {currentIndex === unahonSections.length ? (
                                    <>
                                        <Button
                                            onPress={goToPreviousSection}
                                            variant="bordered"
                                            className="font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-300 min-w-[120px]"
                                            size="lg"
                                            startContent={
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 19l-7-7 7-7"
                                                    />
                                                </svg>
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            isDisabled={isViewOnly}
                                            onPress={handleOpenConfirmModal}
                                            className={`font-bold text-white shadow-xl hover:shadow-2xl disabled:opacity-50 transition-all duration-300 hover:-translate-y-1 min-w-[160px] ${
                                                isReassessment
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                                                    : 'bg-gradient-to-r from-[#7B122F] to-[#A3153D] hover:from-[#6A0F28] hover:to-[#8E1A3D]'
                                            }`}
                                            size="lg"
                                        >
                                            {isReassessment
                                                ? 'Submit Reassessment'
                                                : 'Submit Assessment'}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onPress={goToPreviousSection}
                                            variant="bordered"
                                            className="font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all duration-300 min-w-[120px]"
                                            size="lg"
                                            isDisabled={isPreviousButtonDisabled()}
                                            startContent={
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 19l-7-7 7-7"
                                                    />
                                                </svg>
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onPress={goToNextSection}
                                            className="font-bold bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300 hover:-translate-y-1 min-w-[120px]"
                                            size="lg"
                                            isDisabled={isNextButtonDisabled()}
                                            endContent={
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            }
                                        >
                                            Next
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Guide Section */}
                {currentIndex !== unahonSections.length && (
                    <div className="mb-8 mt-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 text-white">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            Assessment Guidelines
                        </h2>

                        <Card className="bg-transparent shadow-none border-none">
                            <CardBody className="pt-2 pb-2 px-0 overflow-visible">
                                <UnahonGuide page={currentIndex + 1} />
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* MHPSS Modal */}
                <MHPSSLevel isOpen={isOpen} onOpenChange={onOpenChange} />

                <SuccessDialog
                    open={showSuccessDialog}
                    variant={submissionError ? 'warning' : 'success'}
                    title={
                        submissionError ? 'Assessment not saved' : 'Success!'
                    }
                    message={
                        submissionError || 'Assessment saved successfully.'
                    }
                    onClose={() => {
                        setShowSuccessDialog(false);
                        if (!submissionError) handleExitAssessment();
                    }}
                />

                {/* Confirmation Modal */}
                <UnahonConfirmModal
                    isOpen={showConfirmModal}
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleConfirmSubmit}
                />
            </div>
        </div>
    );
};

export default Unahon;
