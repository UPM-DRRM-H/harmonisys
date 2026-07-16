'use client';

import { useState } from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from '@heroui/react';

const levels = [
    {
        num: 4,
        label: 'Specialized Services',
        desc: 'Mental Health care by Mental Health specialists (e.g. psychiatric nurses, psychologists, psychlatrists)',
        bg: 'bg-red-500',
        expandBg: 'bg-red-50',
        text: 'text-white',
        descText: 'text-red-800',
        border: 'border-red-300',
        width: 'w-[55%]',
    },
    {
        num: 3,
        label: 'Focused Non-Specialized Support',
        desc: 'Basic Mental Health care by PHC doctors. Basic emotional and practical support by community workers.',
        bg: 'bg-orange-400',
        expandBg: 'bg-orange-50',
        text: 'text-white',
        descText: 'text-orange-800',
        border: 'border-orange-300',
        width: 'w-[70%]',
    },
    {
        num: 2,
        label: 'Community and Family Support',
        desc: 'Communal traditional supports. Supportive child-friendly spaces. Activating social networks.',
        bg: 'bg-yellow-300',
        expandBg: 'bg-yellow-50',
        text: 'text-yellow-900',
        descText: 'text-yellow-800',
        border: 'border-yellow-300',
        width: 'w-[85%]',
    },
    {
        num: 1,
        label: 'Social Considerations in Basic Services and Security',
        desc: 'Advocacy for basic services that are safe, socially approprlate and that protect dignity.',
        bg: 'bg-green-500',
        expandBg: 'bg-green-50',
        text: 'text-white',
        descText: 'text-green-800',
        border: 'border-green-300',
        width: 'w-full',
    },
];

const MHPSSLevel = ({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                backdrop: 'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20',
                base: 'border-[#292f46] bg-gradient-to-br from-white via-white to-slate-50',
                header: 'border-b-[1px] border-slate-200',
                body: 'py-6',
                footer: 'border-t-[1px] border-slate-200',
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
                                        MHPSS Level Legend
                                    </h3>
                                    <p className="text-slate-600 font-medium">
                                        Mental Health and Psychosocial Support Levels
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody>
                            <p className="text-xs text-slate-400 text-center mb-2">Tap a level to see details</p>
                            <div className="flex flex-col items-center gap-0">
                                {levels.map((level) => (
                                    <div key={level.num} className={`${level.width} transition-all duration-300`}>
                                        <button
                                            onClick={() => setExpanded(expanded === level.num ? null : level.num)}
                                            className={`w-full ${level.bg} ${level.text} text-center px-4 py-3 transition-opacity hover:opacity-90 active:opacity-80
                                                ${level.num === 4 ? 'rounded-t-2xl' : ''}
                                                ${level.num === 1 && expanded !== 1 ? 'rounded-b-2xl' : ''}
                                            `}
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-0.5">Level {level.num}</p>
                                            <p className="font-black text-sm leading-tight">{level.label}</p>
                                            <p className="text-[10px] opacity-60 mt-0.5">{expanded === level.num ? '▲ hide' : '▼ details'}</p>
                                        </button>

                                        {expanded === level.num && (
                                            <div className={`${level.expandBg} border ${level.border} px-4 py-3 text-sm ${level.descText} leading-relaxed ${level.num === 1 ? 'rounded-b-xl' : ''}`}>
                                                {level.desc}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Source */}
                            <div className="mt-5 pt-4 border-t border-slate-200">
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    <span className="font-semibold text-slate-500">Source: </span>
                                    Cuevas, F. P. (n.d.). Mental health in the Philippines: Status and challenges [Report]. Department of Health, Philippines.{' '}
                                    <a
                                        href="https://www.mhlw.go.jp/content/10500000/000914594.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 underline underline-offset-2 break-all"
                                    >
                                        https://www.mhlw.go.jp/content/10500000/000914594.pdf
                                    </a>
                                </p>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                onPress={onClose}
                                className="font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default MHPSSLevel;
