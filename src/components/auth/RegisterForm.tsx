'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button, Select, SelectItem, Checkbox } from '@heroui/react';
import {
    Mail,
    Lock,
    User,
    Users,
    MapPin,
    Briefcase,
    HeartPulse,
    Building2,
    Upload,
    ShieldCheck,
} from 'lucide-react';
import AuthFloatingInput from './AuthFloatingInput';
import Link from 'next/link';

const TERMS_AND_PRIVACY_URL =
    process.env.NEXT_PUBLIC_TERMS_AND_PRIVACY_URL || '/';

interface RegisterFormProps {
    onSwitchToLogin?: () => void;
    onSuccess?: () => void;
}

const genderOptions = [
    { key: 'MALE', label: 'Male' },
    { key: 'FEMALE', label: 'Female' },
];

const roleOptions = [
    { key: 'STANDARD', label: 'Standard User' },
    { key: 'RESPONDER', label: 'Responder' },
    { key: 'ADMIN', label: 'Admin' },
];

const mhpssLevelOptions = [
    { key: 'LEVEL_1', label: 'Level 1 - Basic Psychosocial Support' },
    { key: 'LEVEL_2', label: 'Level 2 - Focused Psychosocial Support' },
    { key: 'LEVEL_3', label: 'Level 3 - Psychological Support' },
    { key: 'LEVEL_4', label: 'Level 4 - Specialized Mental Health Care' },
];

const regionOptions = [
    { key: 'NCR', label: 'National Capital Region (NCR)' },
    { key: 'CAR', label: 'Cordillera Administrative Region (CAR)' },
    { key: 'Region I', label: 'Region I - Ilocos Region' },
    { key: 'Region II', label: 'Region II - Cagayan Valley' },
    { key: 'Region III', label: 'Region III - Central Luzon' },
    { key: 'Region IV-A', label: 'Region IV-A - CALABARZON' },
    { key: 'Region IV-B', label: 'Region IV-B - MIMAROPA' },
    { key: 'Region V', label: 'Region V - Bicol Region' },
    { key: 'Region VI', label: 'Region VI - Western Visayas' },
    { key: 'Region VII', label: 'Region VII - Central Visayas' },
    { key: 'Region VIII', label: 'Region VIII - Eastern Visayas' },
    { key: 'Region IX', label: 'Region IX - Zamboanga Peninsula' },
    { key: 'Region X', label: 'Region X - Northern Mindanao' },
    { key: 'Region XI', label: 'Region XI - Davao Region' },
    { key: 'Region XII', label: 'Region XII - SOCCSKSARGEN' },
    { key: 'Region XIII', label: 'Region XIII - Caraga' },
    {
        key: 'BARMM',
        label: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
    },
];

const selectClassNames = {
    base: 'w-full',
    label: 'hidden',
    trigger:
        'h-16 min-h-16 rounded-[22px] border border-white/25 bg-white/10 px-4 !text-white shadow-none transition-all duration-200 hover:border-white/35 data-[focus=true]:border-white/50 data-[open=true]:border-white/50',
    mainWrapper: 'text-white',
    innerWrapper: '!text-white',
    value: '!text-white text-[1.05rem] font-medium',
    selectorIcon: '!text-white/80',
    listboxWrapper: 'max-h-64',
    popoverContent:
        'bg-[rgb(104,10,20)] text-white border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] rounded-2xl',
    listbox: 'bg-[rgb(104,10,20)] text-white p-2 rounded-2xl',
};

const itemClassNames = {
    base: 'rounded-xl text-white data-[hover=true]:bg-white/10 data-[selectable=true]:focus:bg-white/10',
    title: 'text-white text-[1rem]',
    selectedIcon: 'text-white',
};

// ─── OTP Step ────────────────────────────────────────────────────────────────

const OTP_RESEND_COOLDOWN = 60;

interface OtpStepProps {
    email: string;
    onVerified: (verificationToken: string) => void;
    onBack: () => void;
}

function OtpStep({ email, onVerified, onBack }: OtpStepProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        startCooldown();
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    function startCooldown() {
        setCooldown(OTP_RESEND_COOLDOWN);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    const handleVerify = async () => {
        if (!otp.trim()) return;
        setError(null);
        setIsPending(true);

        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp }),
            });
            const data = await res.json();

            if (!res.ok || !data?.success) {
                setError(data?.message ?? 'Verification failed.');
                return;
            }

            onVerified(data.verificationToken);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsPending(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setError(null);
        setOtp('');
        setIsPending(true);

        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok || !data?.success) {
                setError(data?.message ?? 'Could not resend OTP.');
                return;
            }

            startCooldown();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/15 ring-2 ring-yellow-400/30">
                    <ShieldCheck className="h-8 w-8 text-yellow-300" />
                </div>
                <div>
                    <p className="text-lg font-semibold text-white">
                        Check your email
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                        We sent a 6-digit code to{' '}
                        <span className="font-medium text-white/90">
                            {email}
                        </span>
                    </p>
                </div>
            </div>

            <AuthFloatingInput
                type="text"
                label="Enter 6-digit code"
                value={otp}
                onChange={(val) => {
                    setOtp(val.replace(/\D/g, '').slice(0, 6));
                }}
                icon={<ShieldCheck className="w-5 h-5" />}
                required
                autoComplete="one-time-code"
            />

            {error && (
                <div className="rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                </div>
            )}

            <Button
                onPress={handleVerify}
                isDisabled={otp.length !== 6 || isPending}
                isLoading={isPending}
                className="w-full h-14 rounded-2xl bg-yellow-400 text-black font-bold text-[18px] hover:bg-yellow-300 disabled:opacity-50"
            >
                {isPending ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="flex items-center justify-between text-sm text-white/70">
                <button
                    type="button"
                    onClick={onBack}
                    className="hover:text-white underline underline-offset-4"
                >
                    ← Go back
                </button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isPending}
                    className="font-medium text-white/90 underline underline-offset-4 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
            </div>
        </div>
    );
}

// ─── Main Registration Form ───────────────────────────────────────────────────

type Step = 'form' | 'otp' | 'done';

const RegisterForm: React.FC<RegisterFormProps> = ({
    onSwitchToLogin,
    onSuccess,
}) => {
    const [step, setStep] = useState<Step>('form');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [region, setRegion] = useState('');
    const [mhpssLevel, setMhpssLevel] = useState('');
    const [mhpssCertificateFile, setMhpssCertificateFile] =
        useState<File | null>(null);
    const [responderOrganization, setResponderOrganization] = useState('');
    const mhpssCertificateInputRef = useRef<HTMLInputElement | null>(null);
    const [role, setRole] = useState('');
    const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);
    const passwordRules = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'At least 1 uppercase', met: /[A-Z]/.test(password) },
        { label: 'At least 1 symbol', met: /[^a-zA-Z0-9]/.test(password) },
    ];
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (passwordRules.some((r) => !r.met)) {
            setErrorMessage('Password does not meet the requirements.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        if (role === 'RESPONDER') {
            if (!mhpssLevel) {
                setErrorMessage('Please select your MHPSS Level.');
                return;
            }
            if (!mhpssCertificateFile) {
                setErrorMessage(
                    'Please upload your certificate or proof of MHPSS Level.'
                );
                return;
            }
            if (!responderOrganization.trim()) {
                setErrorMessage(
                    'Please enter your responder organization or affiliation.'
                );
                return;
            }
        }

        if (!privacyPolicyAccepted) {
            setErrorMessage('Please accept the Privacy Policy to continue.');
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch('/api/otp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();

                if (!res.ok || !data?.success) {
                    setErrorMessage(data?.message ?? 'Failed to send OTP.');
                    return;
                }

                setStep('otp');
            } catch {
                setErrorMessage('Something went wrong. Please try again.');
            }
        });
    };

    const completeRegistration = (verificationToken: string) => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('firstName', firstName);
                formData.append('lastName', lastName);
                formData.append('gender', gender);
                formData.append('region', region);
                formData.append('mhpssLevel', mhpssLevel);
                formData.append('role', role);
                formData.append(
                    'privacyPolicyAccepted',
                    String(privacyPolicyAccepted)
                );
                formData.append('email', email);
                formData.append('verificationToken', verificationToken);
                formData.append('password', password);
                formData.append('confirmPassword', confirmPassword);
                formData.append('responderOrganization', responderOrganization);

                if (mhpssCertificateFile) {
                    formData.append(
                        'mhpssCertificateFile',
                        mhpssCertificateFile
                    );
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();

                if (!res.ok || !data?.success) {
                    setStep('form');
                    setErrorMessage(data?.message || 'Registration failed.');
                    return;
                }

                setSuccessMessage(
                    data.message ||
                        'Registration successful. You can now log in.'
                );
                setStep('done');
                onSuccess?.();
            } catch {
                setStep('form');
                setErrorMessage('Something went wrong during registration.');
            }
        });
    };

    // ── OTP step ──────────────────────────────────────────────────────────────
    if (step === 'otp') {
        return (
            <OtpStep
                email={email}
                onVerified={completeRegistration}
                onBack={() => {
                    setStep('form');
                    setErrorMessage(null);
                }}
            />
        );
    }

    // ── Success state ─────────────────────────────────────────────────────────
    if (step === 'done') {
        return (
            <div className="w-full space-y-6 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 ring-2 ring-emerald-400/30">
                        <ShieldCheck className="h-8 w-8 text-emerald-300" />
                    </div>
                    <p className="text-lg font-semibold text-white">
                        Registration complete!
                    </p>
                    <p className="text-sm text-white/60">
                        {successMessage ||
                            'Your account has been verified and created.'}
                    </p>
                </div>

                <Button
                    onPress={onSwitchToLogin}
                    className="w-full h-14 rounded-2xl bg-yellow-400 text-black font-bold text-[18px] hover:bg-yellow-300"
                >
                    Go to Login
                </Button>
            </div>
        );
    }

    // ── Registration form ─────────────────────────────────────────────────────
    return (
        <div className="w-full">
            <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
                <AuthFloatingInput
                    type="text"
                    label="Enter first name"
                    value={firstName}
                    onChange={setFirstName}
                    icon={<User className="w-5 h-5" />}
                    required
                    autoComplete="off"
                />

                <AuthFloatingInput
                    type="text"
                    label="Enter last name"
                    value={lastName}
                    onChange={setLastName}
                    icon={<User className="w-5 h-5" />}
                    required
                    autoComplete="off"
                />

                <div className="space-y-4">
                    <Select
                        placeholder="Gender"
                        startContent={
                            !gender ? (
                                <Users className="w-5 h-5 text-white/80" />
                            ) : null
                        }
                        selectedKeys={gender ? [gender] : []}
                        onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0];
                            setGender(String(value || ''));
                        }}
                        variant="bordered"
                        classNames={selectClassNames}
                        disallowEmptySelection={false}
                        renderValue={(items) => (
                            <span className="text-[1.05rem] font-medium text-white">
                                {items[0]?.textValue}
                            </span>
                        )}
                    >
                        {genderOptions.map((item) => (
                            <SelectItem
                                key={item.key}
                                classNames={itemClassNames}
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </Select>

                    <Select
                        placeholder="Region"
                        startContent={
                            !region ? (
                                <MapPin className="w-5 h-5 text-white/80" />
                            ) : null
                        }
                        selectedKeys={region ? [region] : []}
                        onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0];
                            setRegion(String(value || ''));
                        }}
                        variant="bordered"
                        classNames={selectClassNames}
                        disallowEmptySelection={false}
                        renderValue={(items) => (
                            <span className="text-[1.05rem] font-medium text-white">
                                {items[0]?.textValue}
                            </span>
                        )}
                    >
                        {regionOptions.map((item) => (
                            <SelectItem
                                key={item.key}
                                classNames={itemClassNames}
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </Select>

                    <Select
                        placeholder="Role"
                        startContent={
                            !role ? (
                                <Briefcase className="w-5 h-5 text-white/80" />
                            ) : null
                        }
                        selectedKeys={role ? [role] : []}
                        onSelectionChange={(keys) => {
                            const value = String(Array.from(keys)[0] || '');
                            setRole(value);

                            if (value !== 'RESPONDER') {
                                setMhpssLevel('');
                                setMhpssCertificateFile(null);
                                setResponderOrganization('');

                                if (mhpssCertificateInputRef.current) {
                                    mhpssCertificateInputRef.current.value = '';
                                }
                            }
                        }}
                        variant="bordered"
                        classNames={selectClassNames}
                        disallowEmptySelection={false}
                        renderValue={(items) => (
                            <span className="text-[1.05rem] font-medium text-white">
                                {items[0]?.textValue}
                            </span>
                        )}
                    >
                        {roleOptions.map((item) => (
                            <SelectItem
                                key={item.key}
                                classNames={itemClassNames}
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </Select>

                    {role === 'RESPONDER' && (
                        <>
                            <Select
                                placeholder="MHPSS Level"
                                startContent={
                                    !mhpssLevel ? (
                                        <HeartPulse className="w-5 h-5 text-white/80" />
                                    ) : null
                                }
                                selectedKeys={mhpssLevel ? [mhpssLevel] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0];
                                    setMhpssLevel(String(value || ''));
                                }}
                                variant="bordered"
                                classNames={selectClassNames}
                                disallowEmptySelection={false}
                                renderValue={(items) => (
                                    <span className="text-[1.05rem] font-medium text-white">
                                        {items[0]?.textValue}
                                    </span>
                                )}
                            >
                                {mhpssLevelOptions.map((item) => (
                                    <SelectItem
                                        key={item.key}
                                        classNames={itemClassNames}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            <div className="w-full">
                                <label
                                    htmlFor="mhpssCertificateFile"
                                    className="
                                        flex min-h-[64px] w-full cursor-pointer items-center justify-between
                                        rounded-[22px] border border-white/25 bg-white/10 px-5
                                        text-white transition-all duration-200 hover:border-white/40
                                    "
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Upload className="h-5 w-5 shrink-0 text-white/80" />
                                        <span className="truncate text-[1.05rem] text-white/90">
                                            {mhpssCertificateFile
                                                ? mhpssCertificateFile.name
                                                : 'Upload Certificate / Proof of MHPSS Level'}
                                        </span>
                                    </div>
                                    <span className="ml-4 shrink-0 text-sm font-medium text-yellow-300">
                                        Choose File
                                    </span>
                                </label>

                                <input
                                    ref={mhpssCertificateInputRef}
                                    id="mhpssCertificateFile"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file =
                                            e.target.files?.[0] || null;
                                        setMhpssCertificateFile(file);
                                    }}
                                />
                            </div>

                            <AuthFloatingInput
                                type="text"
                                label="Responder Organization / Affiliation"
                                value={responderOrganization}
                                onChange={setResponderOrganization}
                                icon={<Building2 className="w-5 h-5" />}
                                required={role === 'RESPONDER'}
                                autoComplete="off"
                            />
                        </>
                    )}
                </div>

                <div className="flex justify-end">
                    <div className="flex items-center gap-3 pt-1">
                        <Checkbox
                            color="warning"
                            isSelected={privacyPolicyAccepted}
                            onValueChange={setPrivacyPolicyAccepted}
                        />
                        <div className="text-sm text-white/90">
                            I agree to the{' '}
                            <Link
                                href={TERMS_AND_PRIVACY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-yellow-300 hover:text-yellow-200 underline underline-offset-4"
                            >
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>

                <AuthFloatingInput
                    type="email"
                    label="Enter email"
                    value={email}
                    onChange={setEmail}
                    icon={<Mail className="w-5 h-5" />}
                    required
                    autoComplete="off"
                />

                <div className="space-y-2">
                    <AuthFloatingInput
                        type="password"
                        label="Enter password"
                        value={password}
                        onChange={(val) => {
                            setPassword(val);
                            if (!passwordTouched) setPasswordTouched(true);
                        }}
                        icon={<Lock className="w-5 h-5" />}
                        required
                        autoComplete="new-password"
                    />

                    {passwordTouched && (
                        <ul className="space-y-1 px-1">
                            {passwordRules.map((rule) => (
                                <li
                                    key={rule.label}
                                    className={`flex items-center gap-2 text-xs transition-colors ${
                                        rule.met
                                            ? 'text-emerald-300'
                                            : 'text-white/50'
                                    }`}
                                >
                                    <span className="text-[10px]">
                                        {rule.met ? '✓' : '○'}
                                    </span>
                                    {rule.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <AuthFloatingInput
                    type="password"
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    icon={<Lock className="w-5 h-5" />}
                    required
                    autoComplete="new-password"
                />

                {errorMessage && (
                    <div className="rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                        {successMessage}
                    </div>
                )}

                <Button
                    type="submit"
                    isLoading={isPending}
                    className="w-full h-14 rounded-2xl bg-yellow-400 text-black font-bold text-[18px] hover:bg-yellow-300"
                >
                    Continue
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-white/80">
                Already have an account?{' '}
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-medium text-white underline underline-offset-4 hover:text-yellow-200"
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default RegisterForm;
