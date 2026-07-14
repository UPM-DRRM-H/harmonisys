'use client';

import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dynamic from 'next/dynamic';
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Button,
    Chip,
    Skeleton,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@heroui/react';
import {
    Search,
    MapPin,
    AlertTriangle,
    Globe,
    Clock,
    MapPinned,
    PanelRightClose,
    PanelRightOpen,
    LocateFixed,
    Download,
} from 'lucide-react';
import Questionnaire from '../irs/Questionnaire';

interface NominatimResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
}

interface HazardData {
    activeFault: {
        assessment: string;
        explanation: string;
        distance: string;
        units: string;
        direction: string;
        fault_name: string;
    };
    groundRupture: {
        assessment: string;
        explanation: string;
        distance: string;
        units: string;
        direction: string;
    };
    groundShaking: {
        assessment: string;
        explanation: string[];
    };
    eil: {
        assessment: string;
        explanation: string[];
    };
    liquefaction: {
        assessment: string;
        explanation: string[];
    };
    tsunami: {
        assessment: string;
        explanation: string[];
        result: string;
    };
    flood: {
        assessment: string;
        explanation: string[];
        result: string;
    };
    ril: {
        assessment: string;
        explanation: string[];
        result: string;
    };
    stormSurge: {
        assessment: string;
        explanation: string[];
        result: string;
    };
    ashfall: {
        assessment: string;
        explanation: string[];
    };
    coordinates: {
        latitude: string;
        longitude: string;
    };
    location: {
        name: string;
    };
}

interface ApiResponse {
    message: string;
    data: {
        success: boolean;
        message: string;
        data: HazardData;
    };
}

type HazardResultCardProps = {
    title: string;
    subtitle: string;
    assessment: string;
    icon: React.ReactNode;
    summary?: string;
    detailLabel?: string;
    detailValue?: string;
    explanation?: string;
    onClick?: () => void;
};

type SelectedHazardCard = {
    title: string;
    subtitle: string;
    assessment: string;
    icon: React.ReactNode;
    detailLabel?: string;
    detailValue?: string;
    summary?: string;
    explanation?: string;
};

type OverviewStatCardProps = {
    title: string;
    subtitle: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    accentBarClass: string;
};

const HazardHunterMap = dynamic(() => import('./HazardHunterMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full rounded-none overflow-hidden" />
    ),
});

const HazardHunter = () => {
    const {
        isOpen: isReportIncidentOpen,
        onOpen: onOpenReportIncident,
        onClose: onCloseReportIncident,
        onOpenChange: onReportIncidentOpenChange,
    } = useDisclosure();
    const loadImageAsDataUrl = (src: string) =>
        new Promise<{ dataUrl: string; width: number; height: number }>(
            (resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not create canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0);
                    resolve({
                        dataUrl: canvas.toDataURL('image/png'),
                        width: img.width,
                        height: img.height,
                    });
                };

                img.onerror = reject;
                img.src = src;
            }
        );

    const cleanText = (value?: string) =>
        (value || 'N/A')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/?[^>]+(>|$)/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const shortenText = (value?: string, maxLength = 95) => {
        const splitTextToJustifiedLines = (
            doc: jsPDF,
            text: string,
            maxWidth: number,
            fontSize: number
        ) => {
            const words = cleanText(text).split(' ').filter(Boolean);
            const lines: string[][] = [];
            let currentLine: string[] = [];

            doc.setFontSize(fontSize);

            for (const word of words) {
                const testLine = [...currentLine, word].join(' ');
                const testWidth = doc.getTextWidth(testLine);

                if (testWidth <= maxWidth || currentLine.length === 0) {
                    currentLine.push(word);
                } else {
                    lines.push(currentLine);
                    currentLine = [word];
                }
            }

            if (currentLine.length) {
                lines.push(currentLine);
            }

            return lines;
        };

        const drawJustifiedText = ({
            doc,
            text,
            x,
            y,
            maxWidth,
            fontSize,
            lineHeight,
        }: {
            doc: jsPDF;
            text: string;
            x: number;
            y: number;
            maxWidth: number;
            fontSize: number;
            lineHeight: number;
        }) => {
            const lines = splitTextToJustifiedLines(
                doc,
                text,
                maxWidth,
                fontSize
            );

            doc.setFontSize(fontSize);

            lines.forEach((words, index) => {
                const isLastLine = index === lines.length - 1;
                const lineText = words.join(' ');

                if (isLastLine || words.length === 1) {
                    doc.text(lineText, x, y + index * lineHeight);
                    return;
                }

                const wordsWidth = words.reduce(
                    (sum, word) => sum + doc.getTextWidth(word),
                    0
                );
                const totalSpacing = maxWidth - wordsWidth;
                const gaps = words.length - 1;
                const extraSpace = totalSpacing / gaps;

                let currentX = x;

                words.forEach((word, wordIndex) => {
                    doc.text(word, currentX, y + index * lineHeight);
                    currentX += doc.getTextWidth(word);

                    if (wordIndex < gaps) {
                        currentX += extraSpace;
                    }
                });
            });

            return y + lines.length * lineHeight;
        };
        const text = cleanText(value);
        if (text.length <= maxLength) return text;
        return `${text.slice(0, maxLength).trim()}...`;
    };

    const handleDownloadAssessmentPDF = async () => {
        if (!hazardData) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const selectedLocation =
            hazardData?.location?.name ||
            placeInput ||
            detectedLocationLabel ||
            'Selected location';

        const coordinatesText = hasValidMapCoordinates
            ? `${mapCoordinates.lat.toFixed(6)}, ${mapCoordinates.lng.toFixed(6)}`
            : 'N/A';

        try {
            const logo = await loadImageAsDataUrl('/hazardHunter_logo.png');

            const pageWidth = doc.internal.pageSize.getWidth();
            const maxLogoHeight = 32;
            const logoAspectRatio = logo.width / logo.height;

            const logoHeight = maxLogoHeight;
            const logoWidth = logoHeight * logoAspectRatio;

            const logoX = pageWidth - logoWidth - 16; // move slightly left
            const logoY = 8;

            doc.addImage(
                logo.dataUrl,
                'PNG',
                logoX,
                logoY,
                logoWidth,
                logoHeight,
                undefined,
                'FAST'
            );
        } catch (error) {
            console.error('Failed to load PDF logo:', error);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(35, 43, 60);
        doc.text('HazardHunter Assessment Results', 14, 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(80, 90, 110);
        doc.text(`Selected Location: ${selectedLocation}`, 14, 25);
        doc.text(`Coordinates: ${coordinatesText}`, 14, 30);
        doc.text(`Total Hazards: ${getTotalHazards()}`, 14, 35);
        doc.text(`High Risk Count: ${getHighRiskCount()}`, 14, 40);

        autoTable(doc, {
            startY: 48,
            head: [['Hazard', 'Assessment', 'Details']],
            body: [
                [
                    'Active Fault',
                    hazardData.activeFault.assessment,
                    cleanText(
                        `${hazardData.activeFault.distance} ${hazardData.activeFault.units} ${hazardData.activeFault.direction} | Fault: ${hazardData.activeFault.fault_name}`
                    ),
                ],
                [
                    'Ground Rupture',
                    hazardData.groundRupture.assessment,
                    cleanText(
                        `${hazardData.groundRupture.distance} ${hazardData.groundRupture.units} ${hazardData.groundRupture.direction}`
                    ),
                ],
                [
                    'Ground Shaking',
                    hazardData.groundShaking.assessment,
                    cleanText(hazardData.groundShaking.explanation?.join(' ')),
                ],
                [
                    'Earthquake Landslide',
                    hazardData.eil.assessment,
                    cleanText(hazardData.eil.explanation?.join(' ')),
                ],
                [
                    'Liquefaction',
                    hazardData.liquefaction.assessment,
                    cleanText(hazardData.liquefaction.explanation?.join(' ')),
                ],
                [
                    'Tsunami',
                    hazardData.tsunami.assessment,
                    cleanText(
                        `${hazardData.tsunami.result} | ${hazardData.tsunami.explanation?.join(' ') || ''}`
                    ),
                ],
                [
                    'Flood Risk',
                    hazardData.flood.assessment,
                    cleanText(
                        `${hazardData.flood.result} | ${hazardData.flood.explanation?.join(' ') || ''}`
                    ),
                ],
                [
                    'Rain Landslide',
                    hazardData.ril.assessment,
                    cleanText(
                        `${hazardData.ril.result} | ${hazardData.ril.explanation?.join(' ') || ''}`
                    ),
                ],
                [
                    'Storm Surge',
                    hazardData.stormSurge.assessment,
                    cleanText(
                        `${hazardData.stormSurge.result} | ${hazardData.stormSurge.explanation?.join(' ') || ''}`
                    ),
                ],
                [
                    'Volcanic Ashfall',
                    hazardData.ashfall.assessment,
                    cleanText(hazardData.ashfall.explanation?.join(' ')),
                ],
            ],
            theme: 'grid',
            styles: {
                fontSize: 8.2,
                cellPadding: 1.8,
                lineColor: [220, 220, 220],
                lineWidth: 0.15,
                overflow: 'linebreak',
                valign: 'top',
                textColor: [45, 55, 72],
                cellWidth: 'wrap',
            },
            headStyles: {
                fillColor: [90, 58, 26],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8.4,
                cellPadding: 1.8,
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 34 },
                2: { cellWidth: 114 },
            },
            tableWidth: 178,
            margin: { top: 48, right: 16, bottom: 8, left: 16 },
            pageBreak: 'avoid',
            rowPageBreak: 'avoid',
        });

        const safeFileName = selectedLocation
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '_');

        doc.save(`HazardHunter_Assessment_${safeFileName}.pdf`);
    };
    const [placeInput, setPlaceInput] = useState('');
    const [nominatimResults, setNominatimResults] = useState<NominatimResult[]>(
        []
    );
    const [selectedCoordinates, setSelectedCoordinates] = useState<{
        lat: number;
        lng: number;
    } | null>({
        lat: 14.5995,
        lng: 120.9842,
    });
    const [hazardData, setHazardData] = useState<HazardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchingPlace, setSearchingPlace] = useState(false);
    const skipNextAutocomplete = useRef(false);

    const activeAssessController = useRef<AbortController | null>(null);
    const latestAssessRequestId = useRef(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [selectedHazardCard, setSelectedHazardCard] =
        useState<SelectedHazardCard | null>(null);

    const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(true);
    const [detectedLocationLabel, setDetectedLocationLabel] = useState<
        string | null
    >(null);

    useEffect(() => {
        const trimmed = placeInput.trim();

        if (skipNextAutocomplete.current) {
            skipNextAutocomplete.current = false;
            return;
        }

        if (trimmed.length < 2) {
            setNominatimResults([]);
            return;
        }

        const timeout = setTimeout(() => {
            searchPlace(trimmed);
        }, 400);

        return () => clearTimeout(timeout);
    }, [placeInput]);

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setSelectedCoordinates({ lat, lng });
                setHazardData(null);

                const resolvedLocation = await reverseGeocode(lat, lng);

                setDetectedLocationLabel(resolvedLocation);
                skipNextAutocomplete.current = true;
                setPlaceInput(resolvedLocation);
            },
            () => {
                setDetectedLocationLabel('Metro Manila, Philippines');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    }, []);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );

            const result = await response.json();

            return (
                result?.display_name ||
                result?.address?.city ||
                result?.address?.municipality ||
                result?.address?.town ||
                result?.address?.village ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            );
        } catch (error) {
            console.error('Error reverse geocoding location:', error);
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    };

    useEffect(() => {
        return () => {
            activeAssessController.current?.abort();
        };
    }, []);

    const searchPlace = async (query?: string) => {
        const searchValue = (query ?? placeInput).trim();

        if (!searchValue) {
            setNominatimResults([]);
            return;
        }

        setSearchingPlace(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchValue
                )}&limit=10&countrycodes=ph`
            );
            const results: NominatimResult[] = await response.json();
            setNominatimResults(results);
        } catch (error) {
            console.error('Error searching place:', error);
        } finally {
            setSearchingPlace(false);
        }
    };

    const selectPlace = (result: NominatimResult) => {
        const lat = Number.parseFloat(result.lat);
        const lng = Number.parseFloat(result.lon);

        skipNextAutocomplete.current = true;
        setSelectedCoordinates({ lat, lng });
        setHazardData(null);
        setErrorMessage(null);
        setDetectedLocationLabel(null);
        setPlaceInput(result.display_name);
        setNominatimResults([]);
    };

    const handleMapLocationSelect = async ({
        lat,
        lng,
    }: {
        lat: number;
        lng: number;
    }) => {
        setSelectedCoordinates({ lat, lng });
        setHazardData(null);
        setErrorMessage(null);
        setNominatimResults([]);
        skipNextAutocomplete.current = true;

        const resolvedLocation = await reverseGeocode(lat, lng);

        setDetectedLocationLabel(resolvedLocation);
        setPlaceInput(resolvedLocation);
    };

    const handleMapLocationDoubleClick = async ({
        lat,
        lng,
    }: {
        lat: number;
        lng: number;
    }) => {
        const coords = { lat, lng };

        setSelectedCoordinates(coords);
        setHazardData(null);
        setErrorMessage(null);
        setNominatimResults([]);
        setDetectedLocationLabel(null);
        skipNextAutocomplete.current = true;
        setPlaceInput('Selected location');

        await assessHazard(coords);
    };

    const assessHazard = async (
        coords?: {
            lat: number;
            lng: number;
        } | null
    ) => {
        const targetCoordinates = coords ?? selectedCoordinates;

        if (!targetCoordinates || loading) {
            return;
        }

        activeAssessController.current?.abort();

        const controller = new AbortController();
        activeAssessController.current = controller;

        const requestId = ++latestAssessRequestId.current;

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch('/api/hazardhunter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: targetCoordinates.lat,
                    longitude: targetCoordinates.lng,
                }),
                signal: controller.signal,
            });

            const result = await response.json();

            if (requestId !== latestAssessRequestId.current) {
                return;
            }

            if (!response.ok) {
                setHazardData(null);
                setErrorMessage(
                    result?.error ||
                        result?.message ||
                        result?.data?.message ||
                        'Failed to fetch hazard assessment data'
                );
                return;
            }

            const payload = result?.data?.data ?? result?.data ?? result;
            const normalizedHazardData = payload?.data ?? payload;

            if (payload) {
                setHazardData(normalizedHazardData);
                setIsResultsPanelOpen(true);
            } else {
                setHazardData(null);
                setErrorMessage(
                    result?.error ||
                        result?.message ||
                        result?.data?.message ||
                        'Failed to fetch hazard assessment data'
                );
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            console.error('Error assessing hazard:', error);
            setHazardData(null);
            setErrorMessage('Error occurred while fetching hazard assessment');
        } finally {
            if (requestId === latestAssessRequestId.current) {
                setLoading(false);
            }
        }
    };

    const getAssessmentColor = (
        assessment: string
    ): 'success' | 'danger' | 'warning' | 'default' => {
        const value = assessment.toLowerCase();
        if (value.includes('safe')) return 'success';
        if (value.includes('prone')) return 'danger';
        if (value.includes('outside')) return 'default';
        return 'warning';
    };

    const getHazardIcon = (hazardType: string) => {
        const iconClass = 'text-lg leading-none';
        switch (hazardType.toLowerCase()) {
            case 'fault':
            case 'rupture':
            case 'shaking':
                return <span className={iconClass}>⚠️</span>;
            case 'landslide':
                return <span className={iconClass}>🏔️</span>;
            case 'liquefaction':
                return <span className={iconClass}>💧</span>;
            case 'tsunami':
                return <span className={iconClass}>🌊</span>;
            case 'flood':
                return <span className={iconClass}>🌊</span>;
            case 'storm':
                return <span className={iconClass}>⛈️</span>;
            case 'ashfall':
                return <span className={iconClass}>🌋</span>;
            default:
                return <span className={iconClass}>⚠️</span>;
        }
    };

    const reset = () => {
        setPlaceInput('');
        setDetectedLocationLabel(null);
        setNominatimResults([]);
        setSelectedCoordinates({
            lat: 14.5995,
            lng: 120.9842,
        });
        setHazardData(null);
    };

    const mapCoordinates =
        hazardData?.coordinates?.latitude && hazardData?.coordinates?.longitude
            ? {
                  lat: Number.parseFloat(hazardData.coordinates.latitude),
                  lng: Number.parseFloat(hazardData.coordinates.longitude),
              }
            : selectedCoordinates;

    const hasValidMapCoordinates =
        !!mapCoordinates &&
        Number.isFinite(mapCoordinates.lat) &&
        Number.isFinite(mapCoordinates.lng);

    const selectedLocationLabel =
        hazardData?.location?.name ||
        placeInput ||
        detectedLocationLabel ||
        'Selected location';

    const getTotalHazards = () => {
        if (!hazardData) return 0;
        return [
            hazardData.activeFault,
            hazardData.groundRupture,
            hazardData.groundShaking,
            hazardData.eil,
            hazardData.liquefaction,
            hazardData.tsunami,
            hazardData.flood,
            hazardData.ril,
            hazardData.stormSurge,
            hazardData.ashfall,
        ].length;
    };

    const getHighRiskCount = () => {
        if (!hazardData) return 0;

        const hazards = [
            hazardData.activeFault.assessment,
            hazardData.groundRupture.assessment,
            hazardData.groundShaking.assessment,
            hazardData.eil.assessment,
            hazardData.liquefaction.assessment,
            hazardData.tsunami.assessment,
            hazardData.flood.assessment,
            hazardData.ril.assessment,
            hazardData.stormSurge.assessment,
            hazardData.ashfall.assessment,
        ];

        return hazards.filter(
            (assessment) =>
                assessment.toLowerCase().includes('prone') ||
                assessment.toLowerCase().includes('high')
        ).length;
    };

    const FloatingPanelHazardCard = ({
        title,
        subtitle,
        assessment,
        icon,
        detailValue,
        summary,
        onClick,
    }: HazardResultCardProps) => {
        const chipColor = getAssessmentColor(assessment);

        return (
            <button
                type="button"
                onClick={onClick}
                className="group relative w-full text-left rounded-2xl border border-[#eadbc7] bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all duration-200 p-4 overflow-hidden"
            >
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#f8f1e8] border border-[#eadbc7] shrink-0 flex items-center justify-center w-10 h-10">
                        {icon}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 leading-tight break-words">
                                {title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 break-words">
                                {subtitle}
                            </p>
                        </div>

                        {detailValue && (
                            <p className="text-xs text-slate-700 mt-3 font-medium line-clamp-2 break-words">
                                {detailValue}
                            </p>
                        )}

                        {summary && (
                            <div
                                className="text-xs text-slate-600 mt-2 line-clamp-3 break-words [&_b]:font-bold"
                                dangerouslySetInnerHTML={{
                                    __html: summary,
                                }}
                            />
                        )}

                        <div className="mt-4 pt-3 border-t border-[#efe3d6]">
                            <Chip
                                size="sm"
                                color={chipColor}
                                variant="flat"
                                classNames={{
                                    base: 'max-w-full',
                                    content:
                                        'max-w-[220px] truncate font-semibold text-[11px]',
                                }}
                                title={assessment}
                            >
                                {assessment}
                            </Chip>
                        </div>
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-center px-4">
                    <p className="text-white text-xs font-semibold">
                        Click to view full details
                    </p>
                </div>
            </button>
        );
    };

    const SectionHeader = ({
        title,
        subtitle,
    }: {
        title: string;
        subtitle: string;
    }) => (
        <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#5A3A1A] to-[#B88B5A]" />
                {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1 pl-5">{subtitle}</p>
        </div>
    );

    const OverviewStatCard = ({
        title,
        subtitle,
        value,
        icon,
        accentBarClass,
    }: OverviewStatCardProps) => (
        <Card className="h-full rounded-3xl border border-[#eadbc7] bg-white/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardBody className="p-0 h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="min-w-0">
                            <p className="text-base font-bold text-slate-800 leading-tight">
                                {title}
                            </p>
                            <p className="text-sm text-slate-500 leading-tight mt-1">
                                {subtitle}
                            </p>
                        </div>

                        <div className="shrink-0">{icon}</div>
                    </div>

                    <div className="flex-1">{value}</div>
                </div>

                <div className="h-1.5 w-full mt-auto bg-[#f4ede5]">
                    <div className={`h-full w-full ${accentBarClass}`} />
                </div>
            </CardBody>
        </Card>
    );

    const HazardResultCard = ({
        title,
        subtitle,
        assessment,
        icon,
        summary,
        detailLabel,
        detailValue,
        explanation,
        onClick,
    }: HazardResultCardProps) => {
        const chipColor = getAssessmentColor(assessment);

        return (
            <Card
                isPressable
                onPress={onClick}
                className="group relative h-full min-h-[340px] rounded-3xl border border-[#eadbc7] bg-white/90 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
            >
                <CardHeader className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
                    <div className="flex items-center gap-3 w-full min-w-0">
                        <div className="rounded-2xl bg-[#f8f1e8] border border-[#eadbc7] shrink-0 flex items-center justify-center w-11 h-11">
                            {icon}
                        </div>

                        <div className="min-w-0 pr-1 flex flex-col justify-center">
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight break-words">
                                {title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 leading-tight">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6 flex flex-col min-w-0 h-full overflow-visible">
                    <div className="flex flex-col gap-3 flex-1">
                        {detailValue && (
                            <div className="rounded-2xl border border-[#efe3d6] bg-[#fcfaf7] px-4 py-3 min-h-[78px]">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-bold mb-2">
                                    {detailLabel}
                                </p>
                                <p className="text-[14px] font-semibold text-slate-800 leading-6 break-words line-clamp-2">
                                    {detailValue}
                                </p>
                            </div>
                        )}

                        {summary && (
                            <div className="rounded-2xl border border-[#efe3d6] bg-[#f8f4ee] px-4 py-3 min-h-[116px]">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-bold mb-2">
                                    Summary
                                </p>
                                <p className="text-[14px] text-slate-700 leading-6 line-clamp-3 break-words">
                                    {summary}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#efe3d6] min-w-0">
                        <Chip
                            size="sm"
                            color={chipColor}
                            variant="flat"
                            classNames={{
                                base: 'max-w-full min-w-0',
                                content: 'truncate font-semibold text-[13px]',
                            }}
                            title={assessment}
                        >
                            {assessment}
                        </Chip>
                    </div>
                </CardBody>
                {/* Hover Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-center px-6">
                    <p className="text-white text-sm font-semibold">
                        Click to see full details
                    </p>
                </div>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f6f1e8] via-[#efe4d4] to-[#e8d7c2]">
            <div className="mx-auto w-full px-6 py-8 max-w-[1600px]">
                <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 overflow-hidden rounded-[28px]">
                    <div className="bg-gradient-to-r from-[#5A3A1A] via-[#7B5A3A] to-[#9D7C5A]">
                        <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-[0_12px_22px_rgba(0,0,0,0.35)] mb-2">
                                    HazardHunter Dashboard
                                </h1>
                                <p className="text-white/85 text-lg">
                                    Comprehensive natural hazard risk assessment
                                    and safety analysis for any location
                                </p>
                            </div>
                            <a
                                href="https://hazardhunter.georisk.gov.ph/map"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white text-[#5A3A1A] font-semibold px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                            >
                                <MapPinned className="w-6 h-6 text-[#5A3A1A]" />

                                <span className="whitespace-nowrap">
                                    HazardHunterPH
                                </span>
                            </a>
                        </div>
                    </div>

                    <div className="border-t border-white/30">
                        <CardBody className="p-8">
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Input
                                        placeholder="Enter location (e.g., Manila, Cebu, Davao...)"
                                        value={placeInput}
                                        onChange={(e) => {
                                            setPlaceInput(e.target.value);
                                            setSelectedCoordinates(null); // reset selection if typing again
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                searchPlace();
                                            }
                                        }}
                                        className="flex-1"
                                        classNames={{
                                            input: 'bg-white/80 text-slate-700 placeholder:text-slate-500',
                                            inputWrapper:
                                                'bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border-2 border-[#d9c7b2] shadow-lg hover:shadow-xl hover:border-[#bfa58a] focus-within:border-[#9D7C5A] focus-within:shadow-xl transition-all duration-300 h-12',
                                        }}
                                        startContent={
                                            <MapPin className="h-5 w-5 text-[#7B5A3A]" />
                                        }
                                    />

                                    <Button
                                        size="lg"
                                        onPress={() => searchPlace()}
                                        isLoading={searchingPlace}
                                        disabled={!placeInput.trim()}
                                        className="min-w-[110px] bg-gradient-to-r from-[#5A3A1A] via-[#7B5A3A] to-[#9D7C5A] text-white shadow-lg hover:shadow-xl transition-all"
                                        startContent={
                                            <Search className="w-5 h-5" />
                                        }
                                    >
                                        Search
                                    </Button>

                                    <Button
                                        size="lg"
                                        onPress={() => assessHazard()}
                                        isLoading={loading}
                                        disabled={!selectedCoordinates}
                                        className="min-w-[110px] bg-gradient-to-r from-[#5A3A1A] via-[#7B5A3A] to-[#9D7C5A] text-white shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Assess
                                    </Button>

                                    <Button
                                        variant="flat"
                                        size="lg"
                                        onPress={reset}
                                        className="min-w-[110px] shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Reset
                                    </Button>
                                </div>

                                {errorMessage && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                        <p className="text-sm font-medium text-red-700">
                                            {errorMessage}
                                        </p>
                                    </div>
                                )}

                                {nominatimResults.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-[#7B5A3A]" />
                                            Select a location from the results:
                                        </p>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg max-h-60 overflow-y-auto">
                                            {nominatimResults.map((result) => (
                                                <div
                                                    key={result.place_id}
                                                    className="p-4 cursor-pointer hover:bg-[#f4ede3] transition-all duration-200 border-b border-slate-100/50 last:border-b-0"
                                                    onClick={() =>
                                                        selectPlace(result)
                                                    }
                                                >
                                                    <p className="font-semibold text-sm text-slate-800">
                                                        {result.display_name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </div>
                </Card>

                <div className="relative">
                    <div className="mb-4">
                        <h2 className="text-2xl font-black text-slate-800">
                            Hazard Assessment Map
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Double click anywhere on the map to choose a
                            location and assess hazards instantly.
                        </p>
                    </div>

                    <div className="relative rounded-[32px] overflow-hidden border border-[#d9c7b2] shadow-xl bg-white/60 backdrop-blur-sm">
                        {hasValidMapCoordinates ? (
                            <div className="h-[65vh] min-h-[640px] max-h-[820px]">
                                <HazardHunterMap
                                    lat={mapCoordinates.lat}
                                    lng={mapCoordinates.lng}
                                    locationName={selectedLocationLabel}
                                    highRiskCount={
                                        hazardData ? getHighRiskCount() : 0
                                    }
                                    totalHazards={
                                        hazardData ? getTotalHazards() : 0
                                    }
                                    onLocationSelect={handleMapLocationSelect}
                                    onLocationDoubleClick={
                                        handleMapLocationDoubleClick
                                    }
                                    onOpenReportIncident={onOpenReportIncident}
                                />
                            </div>
                        ) : (
                            <div className="h-[760px] flex items-center justify-center bg-gradient-to-br from-[#f6f1e8] via-[#efe4d4] to-[#e8d7c2]">
                                <div className="max-w-lg text-center px-6">
                                    <div className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-md border border-[#eadbc7] flex items-center justify-center mb-6">
                                        <LocateFixed className="w-10 h-10 text-[#7B5A3A]" />
                                    </div>

                                    <h3 className="text-3xl font-black text-slate-800 mb-3">
                                        Select a Location
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed text-base">
                                        Use the search bar or click anywhere on
                                        the map to choose a location. Then press
                                        Assess to view the hazard summary and
                                        detailed results in the side panel.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isResultsPanelOpen && (
                            <div className="absolute top-4 right-4 bottom-4 w-[380px] max-w-[calc(100%-2rem)] z-[1000]">
                                <div className="h-full rounded-[28px] border border-white/40 bg-white/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
                                    <div className="px-5 py-4 border-b border-[#efe3d6] bg-white/80">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">
                                                    Assessment Results
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Live location summary and
                                                    hazard assessment
                                                </p>
                                            </div>

                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="flat"
                                                className="rounded-xl"
                                                onPress={() =>
                                                    setIsResultsPanelOpen(false)
                                                }
                                            >
                                                <PanelRightClose className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                                        <Card className="rounded-2xl border border-[#eadbc7] bg-[#fcfaf7] shadow-none">
                                            <CardBody className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-bold">
                                                            Selected Location
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-800 mt-2 break-words">
                                                            {
                                                                selectedLocationLabel
                                                            }
                                                        </p>
                                                    </div>

                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="solid"
                                                        className="rounded-xl bg-gradient-to-r from-[#5A3A1A] via-[#7B5A3A] to-[#9D7C5A] text-white shadow-md hover:shadow-lg hover:scale-105 transition-all shrink-0"
                                                        onPress={
                                                            handleDownloadAssessmentPDF
                                                        }
                                                        isDisabled={!hazardData}
                                                        title="Download PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {hasValidMapCoordinates && (
                                                    <p className="text-xs text-slate-500 break-all">
                                                        {mapCoordinates.lat.toFixed(
                                                            6
                                                        )}
                                                        ,{' '}
                                                        {mapCoordinates.lng.toFixed(
                                                            6
                                                        )}
                                                    </p>
                                                )}

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="rounded-2xl bg-white border border-[#eadbc7] p-3">
                                                        <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold">
                                                            Hazards
                                                        </p>
                                                        <p className="text-2xl font-black text-slate-900 mt-2">
                                                            {hazardData
                                                                ? getTotalHazards()
                                                                : 0}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl bg-white border border-[#eadbc7] p-3">
                                                        <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold">
                                                            High Risk
                                                        </p>
                                                        <p className="text-2xl font-black text-slate-900 mt-2">
                                                            {hazardData
                                                                ? getHighRiskCount()
                                                                : 0}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!hazardData && !loading && (
                                                    <div className="rounded-2xl border border-dashed border-[#d9c7b2] bg-white p-4">
                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                            Select a location
                                                            from search results
                                                            or click the map,
                                                            then press{' '}
                                                            <span className="font-semibold">
                                                                Assess
                                                            </span>{' '}
                                                            to view hazard
                                                            results here.
                                                        </p>
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>

                                        {loading ? (
                                            <div className="space-y-3">
                                                {Array.from({ length: 5 }).map(
                                                    (_, index) => (
                                                        <Card
                                                            key={index}
                                                            className="rounded-2xl border border-[#eadbc7] bg-white/90 shadow-none"
                                                        >
                                                            <CardBody className="p-4 space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Skeleton className="w-10 h-10 rounded-xl" />
                                                                    <div className="flex-1">
                                                                        <Skeleton className="w-24 h-4 rounded mb-2" />
                                                                        <Skeleton className="w-20 h-3 rounded" />
                                                                    </div>
                                                                </div>
                                                                <Skeleton className="w-full h-12 rounded-xl" />
                                                                <Skeleton className="w-28 h-5 rounded-full" />
                                                            </CardBody>
                                                        </Card>
                                                    )
                                                )}
                                            </div>
                                        ) : hazardData ? (
                                            <div className="space-y-3">
                                                <FloatingPanelHazardCard
                                                    title="Active Fault"
                                                    subtitle="Seismic fault lines"
                                                    assessment={
                                                        hazardData.activeFault
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'fault'
                                                    )}
                                                    detailValue={`${hazardData.activeFault.distance} ${hazardData.activeFault.units} ${hazardData.activeFault.direction}`}
                                                    summary={`Nearest mapped fault: ${hazardData.activeFault.fault_name}`}
                                                    explanation={
                                                        hazardData.activeFault
                                                            .explanation
                                                    }
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Active Fault',
                                                            subtitle:
                                                                'Seismic fault lines',
                                                            assessment:
                                                                hazardData
                                                                    .activeFault
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'fault'
                                                            ),
                                                            detailLabel:
                                                                'Distance & Direction',
                                                            detailValue: `${hazardData.activeFault.distance} ${hazardData.activeFault.units} ${hazardData.activeFault.direction}`,
                                                            summary: `Nearest mapped fault: ${hazardData.activeFault.fault_name}`,
                                                            explanation:
                                                                hazardData
                                                                    .activeFault
                                                                    .explanation,
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Ground Rupture"
                                                    subtitle="Surface breaking"
                                                    assessment={
                                                        hazardData.groundRupture
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'rupture'
                                                    )}
                                                    detailValue={`${hazardData.groundRupture.distance} ${hazardData.groundRupture.units} ${hazardData.groundRupture.direction}`}
                                                    summary="Potential surface displacement risk related to nearby fault movement."
                                                    explanation={
                                                        hazardData.groundRupture
                                                            .explanation
                                                    }
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Ground Rupture',
                                                            subtitle:
                                                                'Surface breaking',
                                                            assessment:
                                                                hazardData
                                                                    .groundRupture
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'rupture'
                                                            ),
                                                            detailLabel:
                                                                'Distance & Direction',
                                                            detailValue: `${hazardData.groundRupture.distance} ${hazardData.groundRupture.units} ${hazardData.groundRupture.direction}`,
                                                            summary:
                                                                'Potential surface displacement risk related to nearby fault movement.',
                                                            explanation:
                                                                hazardData
                                                                    .groundRupture
                                                                    .explanation,
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Ground Shaking"
                                                    subtitle="Seismic intensity"
                                                    assessment={
                                                        hazardData.groundShaking
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'shaking'
                                                    )}
                                                    summary={
                                                        hazardData.groundShaking
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.groundShaking.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Ground Shaking',
                                                            subtitle:
                                                                'Seismic intensity',
                                                            assessment:
                                                                hazardData
                                                                    .groundShaking
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'shaking'
                                                            ),
                                                            summary:
                                                                hazardData
                                                                    .groundShaking
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.groundShaking.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Earthquake Landslide"
                                                    subtitle="Seismic slope failure"
                                                    assessment={
                                                        hazardData.eil
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'landslide'
                                                    )}
                                                    summary={
                                                        hazardData.eil
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.eil.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Earthquake Landslide',
                                                            subtitle:
                                                                'Seismic slope failure',
                                                            assessment:
                                                                hazardData.eil
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'landslide'
                                                            ),
                                                            summary:
                                                                hazardData.eil
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.eil.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Liquefaction"
                                                    subtitle="Soil liquefaction risk"
                                                    assessment={
                                                        hazardData.liquefaction
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'liquefaction'
                                                    )}
                                                    summary={
                                                        hazardData.liquefaction
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.liquefaction.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Liquefaction',
                                                            subtitle:
                                                                'Soil liquefaction risk',
                                                            assessment:
                                                                hazardData
                                                                    .liquefaction
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'liquefaction'
                                                            ),
                                                            summary:
                                                                hazardData
                                                                    .liquefaction
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.liquefaction.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Tsunami"
                                                    subtitle="Seismic sea waves"
                                                    assessment={
                                                        hazardData.tsunami
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'tsunami'
                                                    )}
                                                    detailValue={
                                                        hazardData.tsunami
                                                            .result
                                                    }
                                                    summary={
                                                        hazardData.tsunami
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.tsunami.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Tsunami',
                                                            subtitle:
                                                                'Seismic sea waves',
                                                            assessment:
                                                                hazardData
                                                                    .tsunami
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'tsunami'
                                                            ),
                                                            detailLabel:
                                                                'Assessment Result',
                                                            detailValue:
                                                                hazardData
                                                                    .tsunami
                                                                    .result,
                                                            summary:
                                                                hazardData
                                                                    .tsunami
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.tsunami.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Flood Risk"
                                                    subtitle="Water inundation"
                                                    assessment={
                                                        hazardData.flood
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'flood'
                                                    )}
                                                    detailValue={
                                                        hazardData.flood.result
                                                    }
                                                    summary={
                                                        hazardData.flood
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.flood.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Flood Risk',
                                                            subtitle:
                                                                'Water inundation',
                                                            assessment:
                                                                hazardData.flood
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'flood'
                                                            ),
                                                            detailLabel:
                                                                'Assessment Result',
                                                            detailValue:
                                                                hazardData.flood
                                                                    .result,
                                                            summary:
                                                                hazardData.flood
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.flood.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Rain Landslide"
                                                    subtitle="Rainfall-induced slides"
                                                    assessment={
                                                        hazardData.ril
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'landslide'
                                                    )}
                                                    detailValue={
                                                        hazardData.ril.result
                                                    }
                                                    summary={
                                                        hazardData.ril
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.ril.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Rain Landslide',
                                                            subtitle:
                                                                'Rainfall-induced slides',
                                                            assessment:
                                                                hazardData.ril
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'landslide'
                                                            ),
                                                            detailLabel:
                                                                'Assessment Result',
                                                            detailValue:
                                                                hazardData.ril
                                                                    .result,
                                                            summary:
                                                                hazardData.ril
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.ril.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Storm Surge"
                                                    subtitle="Coastal storm waves"
                                                    assessment={
                                                        hazardData.stormSurge
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'storm'
                                                    )}
                                                    detailValue={
                                                        hazardData.stormSurge
                                                            .result
                                                    }
                                                    summary={
                                                        hazardData.stormSurge
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.stormSurge.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Storm Surge',
                                                            subtitle:
                                                                'Coastal storm waves',
                                                            assessment:
                                                                hazardData
                                                                    .stormSurge
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'storm'
                                                            ),
                                                            detailLabel:
                                                                'Assessment Result',
                                                            detailValue:
                                                                hazardData
                                                                    .stormSurge
                                                                    .result,
                                                            summary:
                                                                hazardData
                                                                    .stormSurge
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.stormSurge.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <FloatingPanelHazardCard
                                                    title="Volcanic Ashfall"
                                                    subtitle="Volcanic ash deposits"
                                                    assessment={
                                                        hazardData.ashfall
                                                            .assessment
                                                    }
                                                    icon={getHazardIcon(
                                                        'ashfall'
                                                    )}
                                                    summary={
                                                        hazardData.ashfall
                                                            .explanation?.[0]
                                                    }
                                                    explanation={hazardData.ashfall.explanation?.join(
                                                        ' '
                                                    )}
                                                    onClick={() =>
                                                        setSelectedHazardCard({
                                                            title: 'Volcanic Ashfall',
                                                            subtitle:
                                                                'Volcanic ash deposits',
                                                            assessment:
                                                                hazardData
                                                                    .ashfall
                                                                    .assessment,
                                                            icon: getHazardIcon(
                                                                'ashfall'
                                                            ),
                                                            summary:
                                                                hazardData
                                                                    .ashfall
                                                                    .explanation?.[0],
                                                            explanation:
                                                                hazardData.ashfall.explanation?.join(
                                                                    ' '
                                                                ),
                                                        })
                                                    }
                                                />

                                                <div className="pt-0.5 text-center">
                                                    <button
                                                        onClick={
                                                            handleDownloadAssessmentPDF
                                                        }
                                                        className="text-sm font-semibold text-[#5A3A1A] hover:text-[#7B5A3A] underline underline-offset-4 transition-all"
                                                    >
                                                        Download Full Assessment
                                                        Results as PDF
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isResultsPanelOpen && (
                            <div className="absolute top-4 right-4 z-[1000]">
                                <Button
                                    onPress={() => setIsResultsPanelOpen(true)}
                                    className="rounded-2xl shadow-xl bg-white/95 text-slate-800 border border-[#eadbc7]"
                                    startContent={
                                        <PanelRightOpen className="w-4 h-4" />
                                    }
                                >
                                    Show Results
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <Modal
                    isOpen={isReportIncidentOpen}
                    onOpenChange={onReportIncidentOpenChange}
                    size="3xl"
                    scrollBehavior="inside"
                    hideCloseButton
                    classNames={{
                        base: 'rounded-[32px]',
                        backdrop: 'bg-slate-900/45 backdrop-blur-sm',
                    }}
                >
                    <ModalContent>
                        {() => (
                            <>
                                <ModalHeader className="px-6 py-5 border-b border-[#efe3d6]">
                                    <div className="flex items-start justify-between w-full gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5A3A1A] to-[#9D7C5A] text-white shadow-lg">
                                                <AlertTriangle className="w-7 h-7" />
                                            </div>

                                            <div>
                                                <h2 className="text-3xl font-black text-[#5A3A1A] leading-tight">
                                                    Report Incident
                                                </h2>
                                                <p className="text-[#7B5A3A] text-base mt-1">
                                                    Submit a new incident report
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            isIconOnly
                                            variant="light"
                                            className="rounded-xl text-slate-500"
                                            onPress={onCloseReportIncident}
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M18 6L6 18" />
                                                <path d="M6 6l12 12" />
                                            </svg>
                                        </Button>
                                    </div>
                                </ModalHeader>

                                <ModalBody className="px-6 py-6 bg-[#f6f1e8]">
                                    <Questionnaire
                                        onClose={onCloseReportIncident}
                                        openSuccessModal={() => {
                                            onCloseReportIncident();
                                        }}
                                    />
                                </ModalBody>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                <Modal
                    isOpen={!!selectedHazardCard}
                    onOpenChange={(open) => {
                        if (!open) setSelectedHazardCard(null);
                    }}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: 'rounded-3xl',
                        backdrop: 'bg-slate-900/50 backdrop-blur-sm',
                    }}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="px-6 pt-6 pb-4">
                                    {selectedHazardCard && (
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="rounded-2xl bg-[#f8f1e8] border border-[#eadbc7] shrink-0 flex items-center justify-center w-12 h-12">
                                                {selectedHazardCard.icon}
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="text-xl font-bold text-slate-800 leading-tight">
                                                    {selectedHazardCard.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {
                                                        selectedHazardCard.subtitle
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </ModalHeader>

                                <ModalBody className="px-6 pb-2">
                                    {selectedHazardCard?.detailValue && (
                                        <div className="rounded-2xl border border-[#efe3d6] bg-[#fcfaf7] px-4 py-4 mb-4">
                                            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-bold mb-2">
                                                {selectedHazardCard.detailLabel}
                                            </p>
                                            <p className="text-base font-semibold text-slate-800 leading-7 break-words">
                                                {selectedHazardCard.detailValue}
                                            </p>
                                        </div>
                                    )}

                                    {selectedHazardCard?.explanation && (
                                        <div className="rounded-2xl border border-[#efe3d6] bg-[#f8f4ee] px-4 py-4">
                                            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-bold mb-2">
                                                Full Details
                                            </p>
                                            <p
                                                className="text-[15px] text-slate-700 leading-7 break-words"
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        selectedHazardCard.explanation ||
                                                        '',
                                                }}
                                            />
                                        </div>
                                    )}

                                    {!selectedHazardCard?.explanation &&
                                        selectedHazardCard?.summary && (
                                            <div className="rounded-2xl border border-[#efe3d6] bg-[#f8f4ee] px-4 py-4">
                                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-bold mb-2">
                                                    Full Details
                                                </p>
                                                <p
                                                    className="text-[15px] text-slate-700 leading-7 break-words"
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            selectedHazardCard.summary ||
                                                            '',
                                                    }}
                                                />
                                            </div>
                                        )}
                                </ModalBody>

                                <ModalFooter className="px-6 pb-6 pt-4 border-t border-[#efe3d6] flex items-center justify-between gap-4">
                                    {selectedHazardCard && (
                                        <Chip
                                            size="md"
                                            color={getAssessmentColor(
                                                selectedHazardCard.assessment
                                            )}
                                            variant="flat"
                                            classNames={{
                                                base: 'max-w-full',
                                                content:
                                                    'font-semibold text-[14px] whitespace-normal break-words',
                                            }}
                                        >
                                            {selectedHazardCard.assessment}
                                        </Chip>
                                    )}

                                    <Button
                                        variant="flat"
                                        onPress={onClose}
                                        className="rounded-2xl"
                                    >
                                        Close
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </div>
    );
};

export default HazardHunter;
