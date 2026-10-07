'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from '@heroui/react';
type InstallPrompt = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
export default function PwaExperience() {
    const [open, setOpen] = useState(false),
        [online, setOnline] = useState(true),
        [installed, setInstalled] = useState(false),
        [ready, setReady] = useState(false),
        [waiting, setWaiting] = useState<ServiceWorker | null>(null),
        [prompt, setPrompt] = useState<InstallPrompt | null>(null),
        [platform, setPlatform] = useState('browser'),
        [message, setMessage] = useState('');
    const registration = useRef<ServiceWorkerRegistration | null>(null),
        updating = useRef(false);
    useEffect(() => {
        const standalone = () =>
            setInstalled(
                window.matchMedia('(display-mode: standalone)').matches ||
                    !!(navigator as Navigator & { standalone?: boolean })
                        .standalone
            );
        standalone();
        setOnline(navigator.onLine);
        const ua = navigator.userAgent;
        setPlatform(
            /iPad|iPhone|iPod/.test(ua) ||
                (/Mac/.test(ua) && navigator.maxTouchPoints > 1)
                ? 'ios'
                : /Mac/.test(ua) &&
                    /Safari/.test(ua) &&
                    !/Chrome|Chromium/.test(ua)
                  ? 'mac'
                  : 'browser'
        );
        const before = (e: Event) => {
            e.preventDefault();
            setPrompt(e as InstallPrompt);
        };
        const installedHandler = () => {
            setInstalled(true);
            setOpen(false);
            setPrompt(null);
        };
        const connectivity = () => setOnline(navigator.onLine);
        const installRequest = () => setOpen(true);
        window.addEventListener('beforeinstallprompt', before);
        window.addEventListener('appinstalled', installedHandler);
        window.addEventListener('online', connectivity);
        window.addEventListener('offline', connectivity);
        window.addEventListener('harmonisys:install', installRequest);
        const controllerChange = () => {
            if (updating.current) location.reload();
        };
        navigator.serviceWorker?.addEventListener(
            'controllerchange',
            controllerChange
        );
        let disposed = false;
        if ('serviceWorker' in navigator && window.isSecureContext) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/', updateViaCache: 'none' })
                .then((reg) => {
                    if (disposed) return;
                    registration.current = reg;
                    if (reg.waiting) setWaiting(reg.waiting);
                    reg.addEventListener('updatefound', () => {
                        const worker = reg.installing;
                        worker?.addEventListener('statechange', () => {
                            if (worker.state === 'installed') {
                                setReady(true);
                                if (navigator.serviceWorker.controller)
                                    setWaiting(worker);
                            }
                        });
                    });
                    navigator.serviceWorker.ready.then(() => {
                        if (!disposed) setReady(true);
                    });
                })
                .catch(() => {
                    if (!disposed)
                        setMessage(
                            'Offline help is unavailable in this browser. You can still use the connected website.'
                        );
                });
        } else
            setMessage(
                'Use HTTPS or localhost in a supported browser to enable installation and offline help.'
            );
        return () => {
            disposed = true;
            window.removeEventListener('beforeinstallprompt', before);
            window.removeEventListener('appinstalled', installedHandler);
            window.removeEventListener('online', connectivity);
            window.removeEventListener('offline', connectivity);
            window.removeEventListener('harmonisys:install', installRequest);
            navigator.serviceWorker?.removeEventListener(
                'controllerchange',
                controllerChange
            );
        };
    }, []);
    async function install() {
        if (!prompt) return;
        try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === 'accepted') {
                setInstalled(true);
                setOpen(false);
            }
            setPrompt(null);
        } catch {
            setMessage('Use your browser menu to install the app.');
        }
    }
    return (
        <>
            {!installed && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-[#77152d]/20 bg-white px-4 py-3 text-xs font-semibold text-[#77152d] shadow-md hover:bg-rose-50"
                    aria-label="Install Harmonisys app"
                >
                    <Download className="h-4 w-4" />
                    Install app
                </button>
            )}
            {!online && (
                <div
                    role="status"
                    className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-xs text-amber-950"
                >
                    <WifiOff className="h-4 w-4" />
                    Offline: reconnect before submitting changes. Saved app help
                    remains available.
                </div>
            )}
            {waiting && (
                <div
                    role="status"
                    className="fixed bottom-20 left-4 z-40 max-w-xs rounded-xl border bg-white p-4 text-sm shadow-lg"
                >
                    <p className="font-semibold">An app update is ready</p>
                    <p className="mt-1 text-xs text-slate-500">
                        Save or finish your work before refreshing.
                    </p>
                    <button
                        onClick={() => {
                            updating.current = true;
                            waiting.postMessage({ type: 'SKIP_WAITING' });
                        }}
                        className="mt-3 flex items-center gap-2 font-semibold text-[#77152d]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Update now
                    </button>
                    <button
                        aria-label="Dismiss update notice"
                        onClick={() => setWaiting(null)}
                        className="absolute right-2 top-2 p-1"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <Modal
                isOpen={open}
                onOpenChange={setOpen}
                placement="center"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader>Install Harmonisys</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-slate-600">
                                    Open the app from your home screen or
                                    desktop. Installation does not change your
                                    account role or access.
                                </p>
                                {prompt ? (
                                    <p className="rounded-xl bg-rose-50 p-4 text-sm">
                                        Your browser supports installation.
                                        Choose Install below and confirm the
                                        browser prompt.
                                    </p>
                                ) : platform === 'ios' ? (
                                    <ol className="list-decimal space-y-2 pl-5 text-sm">
                                        <li>Open this website in Safari.</li>
                                        <li>
                                            Open Share and choose Add to Home
                                            Screen.
                                        </li>
                                        <li>
                                            Confirm the app name and choose Add.
                                        </li>
                                    </ol>
                                ) : platform === 'mac' ? (
                                    <ol className="list-decimal space-y-2 pl-5 text-sm">
                                        <li>
                                            In a supported Safari version, open
                                            File.
                                        </li>
                                        <li>Choose Add to Dock and confirm.</li>
                                        <li>
                                            Or use Chrome/Edge and its install
                                            option.
                                        </li>
                                    </ol>
                                ) : (
                                    <ol className="list-decimal space-y-2 pl-5 text-sm">
                                        <li>
                                            Open the website in Chrome or Edge.
                                        </li>
                                        <li>
                                            Use the install icon in the address
                                            bar or the browser menu’s Install
                                            app / Add to Home Screen option.
                                        </li>
                                        <li>
                                            If this embedded browser does not
                                            offer installation, open the same
                                            address in your device’s browser.
                                        </li>
                                    </ol>
                                )}
                                <p className="text-xs text-slate-500">
                                    On other devices, use the published HTTPS
                                    address. A laptop’s localhost address is
                                    only available on that laptop.
                                </p>
                                <p
                                    className="text-xs text-slate-500"
                                    role="status"
                                >
                                    {ready
                                        ? 'Offline help is ready. Private records stay online.'
                                        : message ||
                                          'Preparing offline app help…'}
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={close}>
                                    Close
                                </Button>
                                {prompt && (
                                    <Button
                                        className="bg-[#77152d] text-white"
                                        onPress={() => void install()}
                                    >
                                        Install
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
