 'use client';

import React, { createContext, useContext, useMemo } from 'react';

export type ChatTheme = {
    name: 'home' | 'irs' | 'unahon' | 'misalud' | 'hazardhunter' | 'redas';
    headerGradient: string; // CSS linear-gradient(...)
    userBubble: string; // CSS color
    accent: string; // CSS color
    alertBg: string; // CSS color (light)
    alertBorder: string; // CSS color (light)
};

const themes: Record<ChatTheme['name'], ChatTheme> = {
    home: {
        name: 'home',
        headerGradient: 'linear-gradient(135deg, #5B0A0A, #7A1111, #A11B1B)',
        userBubble: '#951515',
        accent: '#8B1538',
        alertBg: 'rgba(139, 21, 56, 0.10)',
        alertBorder: 'rgba(139, 21, 56, 0.20)',
    },
    irs: {
        name: 'irs',
        headerGradient: 'linear-gradient(135deg, #4A0A18, #6B0F25, #8B1538)',
        userBubble: '#6B0F25',
        accent: '#8B1538',
        alertBg: 'rgba(74, 10, 24, 0.08)',
        alertBorder: 'rgba(74, 10, 24, 0.18)',
    },
    unahon: {
        name: 'unahon',
        headerGradient: 'linear-gradient(135deg, #7A0C1E, #991B1B, #B91C1C)',
        userBubble: '#991B1B',
        accent: '#B91C1C',
        alertBg: 'rgba(185, 28, 28, 0.08)',
        alertBorder: 'rgba(185, 28, 28, 0.18)',
    },
    misalud: {
        name: 'misalud',
        headerGradient: 'linear-gradient(135deg, #065F46, #047857, #10B981)',
        userBubble: '#047857',
        accent: '#10B981',
        alertBg: 'rgba(16, 185, 129, 0.10)',
        alertBorder: 'rgba(16, 185, 129, 0.22)',
    },
    hazardhunter: {
        name: 'hazardhunter',
        headerGradient: 'linear-gradient(135deg, #5A3A1A, #7B5A3A, #9D7C5A)',
        userBubble: '#7B5A3A',
        accent: '#5A3A1A',
        alertBg: 'rgba(90, 58, 26, 0.08)',
        alertBorder: 'rgba(90, 58, 26, 0.18)',
    },
    redas: {
        name: 'redas',
        headerGradient: 'linear-gradient(135deg, #1E3A8A, #1D4ED8, #0284C7)',
        userBubble: '#1D4ED8',
        accent: '#0284C7',
        alertBg: 'rgba(2, 132, 199, 0.10)',
        alertBorder: 'rgba(2, 132, 199, 0.22)',
    },
};

const ChatThemeContext = createContext<ChatTheme>(themes.home);

export function useChatTheme() {
    return useContext(ChatThemeContext);
}

export default function ChatThemeProvider({
    theme,
    children,
}: {
    theme: ChatTheme['name'];
    children: React.ReactNode;
}) {
    const value = useMemo(() => themes[theme] ?? themes.home, [theme]);
    return (
        <ChatThemeContext.Provider value={value}>
            {children}
        </ChatThemeContext.Provider>
    );
}
