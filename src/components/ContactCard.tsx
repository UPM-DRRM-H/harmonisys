'use client';

import Link from 'next/link';
import {
    MapPin,
    Mail,
    Phone,
    Facebook,
    MailIcon,
    ExternalLink,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
    Button,
    Card,
    CardBody,
    Input,
    Spinner,
    Textarea,
} from '@heroui/react';

import SubmitResultModal from '@/components/shared/SubmitResultModal';
import { sendMail } from '@/lib/action/email';

const TERMS_AND_PRIVACY_URL =
    process.env.NEXT_PUBLIC_TERMS_AND_PRIVACY_URL || '/';

const ContactCard = () => {
    const contactInfo = [
        {
            icon: MapPin,
            label: 'Address',
            content:
                '2/F Joaquin Gonzales Building, Padre Faura corner Maria Orosa Street, Ermita 1000 Manila, Philippines',
            type: 'text',
        },
        {
            icon: Mail,
            label: 'Email',
            content: 'drrmh.upm@up.edu.ph',
            type: 'email',
            href: 'https://mail.google.com/mail/u/0/?to=drrmh.upm@up.edu.ph&fs=1&tf=cm',
        },
        {
            icon: Phone,
            label: 'Contact Number',
            content: '88141-279 / +63906 059 3124',
            type: 'text',
        },
        {
            icon: Facebook,
            label: 'Facebook',
            content: 'UP Simulation Center',
            type: 'link',
            href: 'https://www.facebook.com/UPSimulationCenter',
        },
    ];

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [resultSuccess, setResultSuccess] = useState<boolean | null>(null);
    const [resultMessage, setResultMessage] = useState<string | undefined>(
        undefined
    );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !message) return;

        setLoading(true);
        try {
            await sendMail({ email, text: message });
            setResultSuccess(true);
            setResultMessage('Your message was sent successfully. Thank you!');
            setEmail('');
            setMessage('');
        } catch (err) {
            console.error('sendMail error', err);
            setResultSuccess(false);
            setResultMessage('Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
            setIsResultOpen(true);
        }
    };

    return (
        <section className="w-full">
            {/* Center + breathing room */}
            <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
                <div className="grid gap-10 lg:grid-cols-2 items-start">
                    {/* LEFT: Plain content */}
                    <div className="max-w-xl">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#2A0B16]">
                            Contact Information
                        </h1>

                        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                            For coordination, concerns, and feedback related to
                            DRRM-H initiatives, send us a message anytime.
                        </p>

                        {/* Contact info grid (less “hugging” + cleaner) */}
                        <div className="mt-8 grid gap-4">
                            {contactInfo.map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={index}
                                        className="
                      rounded-2xl
                      border border-slate-200/70
                      bg-white
                      p-4
                      shadow-sm
                      hover:shadow-md
                      transition-shadow
                    "
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="
                          w-10 h-10
                          rounded-2xl
                          bg-[#8B1538]/10
                          ring-1 ring-[#8B1538]/15
                          flex items-center justify-center
                          flex-shrink-0
                        "
                                            >
                                                <Icon className="h-5 w-5 text-[#8B1538]" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                    {item.label}
                                                </div>

                                                {item.type === 'email' ? (
                                                    <a
                                                        href={item.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="
                              mt-1 block
                              text-sm font-semibold
                              text-[#8B1538]
                              hover:text-[#6B0F25]
                              hover:underline underline-offset-4
                              break-words
                              transition-colors
                            "
                                                    >
                                                        {item.content}
                                                    </a>
                                                ) : item.type === 'link' ? (
                                                    <a
                                                        href={item.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="
                              mt-1 inline-flex items-center gap-1
                              text-sm font-semibold
                              text-[#8B1538]
                              hover:text-[#6B0F25]
                              hover:underline underline-offset-4
                              transition-colors
                            "
                                                    >
                                                        {item.content}
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                ) : (
                                                    <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                                                        {item.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Maroon form card (same feel as footer) */}
                    <div className="lg:justify-self-end w-full max-w-md lg:sticky lg:top-24">
                        <Card
                            className="
                bg-gradient-to-b
                from-[#3A0F1E]
                via-[#2A0B16]
                to-[#18060C]
                border border-white/10
                shadow-[0_18px_45px_rgba(2,6,23,0.22)]
                rounded-2xl
              "
                        >
                            <CardBody className="p-7 min-h-[520px] flex flex-col">
                                <h4 className="text-white text-lg font-semibold mb-2">
                                    Contact Us
                                </h4>

                                <p className="text-rose-100/80 mb-4 text-sm">
                                    Report an emergency or give us feedback.
                                </p>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4 flex-1 flex flex-col"
                                >
                                    <Input
                                        type="email"
                                        label="Email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        endContent={
                                            <MailIcon className="text-[#8B1538]" />
                                        }
                                        required
                                        classNames={{
                                            inputWrapper: 'h-14', 
                                        }}
                                    />

                                    <Textarea
                                        label="Message"
                                        placeholder="Enter your message"
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        minRows={6}
                                        required
                                        className="flex-1"
                                        classNames={{
                                            inputWrapper: 'flex-1',
                                            input: 'h-full min-h-[175px]', 
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        className="
                    w-full
                    h-12
                    bg-[#9B1C1F]       
                    hover:bg-[#82171A]
                    text-white
                    font-semibold
                    tracking-wide
                    transition-colors
                    shadow-md
                  "
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            'Send Message'
                                        )}
                                    </Button>

                                    <p className="text-xs text-rose-100/80 mt-auto">
                                        By submitting, you agree to our{' '}
                                        <Link
                                            href={TERMS_AND_PRIVACY_URL}
                                            className="text-rose-300 hover:text-rose-200 underline-offset-4 hover:underline"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
                                    </p>
                                </form>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                <SubmitResultModal
                    isOpen={isResultOpen}
                    onOpenChange={(open) => setIsResultOpen(Boolean(open))}
                    success={Boolean(resultSuccess)}
                    message={resultMessage}
                />
            </div>
        </section>
    );
};

export default ContactCard;
