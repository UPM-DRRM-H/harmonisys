'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFloatingInputProps {
    label: string;
    type?: 'text' | 'email' | 'password';
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    required?: boolean;
    autoComplete?: string;
}

const AuthFloatingInput: React.FC<AuthFloatingInputProps> = ({
    label,
    type = 'text',
    value,
    onChange,
    icon,
    required = false,
    autoComplete,
}) => {
    const id = useId();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isFloating = isFocused || value.length > 0;
    const isPassword = type === 'password';

    return (
        <div className="relative w-full">
            <div
                className={`
          relative rounded-[22px] border bg-white/10
          transition-[border-color,box-shadow] duration-300
          ${
              isFocused
                  ? 'border-white/60 shadow-[0_0_0_3px_rgba(255,255,255,0.05)]'
                  : 'border-white/25'
          }
        `}
            >
                {/* Floating label box */}
                <div
                    className={`
            pointer-events-none absolute left-5 z-10 flex w-max items-center gap-2
            rounded-md bg-[rgb(104,10,20)] px-2 py-0.5 text-[1.05rem] font-medium leading-none text-white
            transition-[opacity,transform] duration-200
            ${isFloating ? '-top-[11px] opacity-100' : '-top-[11px] opacity-0'}
          `}
                >
                    {icon && (
                        <span className="flex h-5 w-5 items-center justify-center">
                            {icon}
                        </span>
                    )}
                    <span className="whitespace-nowrap">{label}</span>
                </div>

                {/* Inside placeholder row */}
                <div
                    className={`
            pointer-events-none absolute left-5 top-1/2 flex items-center gap-2
            text-[1.05rem] text-white/75
            transition-opacity duration-150
            -translate-y-1/2
            ${isFloating ? 'opacity-0' : 'opacity-100'}
          `}
                >
                    {icon && (
                        <span className="flex h-5 w-5 items-center justify-center">
                            {icon}
                        </span>
                    )}
                    <span className="whitespace-nowrap">{label}</span>
                </div>

                <input
                    id={id}
                    type={
                        isPassword ? (showPassword ? 'text' : 'password') : type
                    }
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required={required}
                    autoComplete={autoComplete}
                    placeholder=""
                    className={`
                w-full rounded-[22px] bg-transparent text-white outline-none
                text-[1.05rem]
                ${isPassword ? 'pr-14' : 'pr-5'}
                h-[60px]
                ${isFloating ? 'pt-9 pb-3 pl-5' : 'pl-5'}
                [appearance:textfield]
                [&::-ms-reveal]:hidden
                [&::-ms-clear]:hidden
            `}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition-colors hover:text-whit"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AuthFloatingInput;
