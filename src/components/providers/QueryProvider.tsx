'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
const Identity = createContext({
    scope: 'uninitialized',
    setScope: (_scope: string) => {},
});
export function useQueryIdentity() {
    return useContext(Identity);
}
export default function QueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 120000,
                        gcTime: 600000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );
    const [scope, setIdentity] = useState('uninitialized');
    const previous = useRef('uninitialized');
    const setScope = useCallback(
        (next: string) => {
            if (previous.current === next) return;
            if (previous.current !== 'uninitialized') client.clear();
            previous.current = next;
            setIdentity(next);
        },
        [client]
    );
    useEffect(() => {
        const clear = () => {
            client.clear();
            previous.current = 'uninitialized';
            setIdentity('uninitialized');
        };
        window.addEventListener('harmonisys:session-change', clear);
        return () =>
            window.removeEventListener('harmonisys:session-change', clear);
    }, [client]);
    return (
        <Identity.Provider value={{ scope, setScope }}>
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        </Identity.Provider>
    );
}
