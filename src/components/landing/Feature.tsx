// Features.tsx
import { Card, CardBody } from '@heroui/react';
import { features } from '@/constants';
import { User, Share2, ShieldCheck } from 'lucide-react';

const MAROON = '#8B1538'; // UP Manila-ish maroon

// Map your feature titles -> lucide icon
const iconMap: Record<string, React.ElementType> = {
    'User-Friendly': User,
    'Tool Integration': Share2,
    Secure: ShieldCheck,
};

const Features = () => {
    return (
        <section className="relative bg-white text-gray-900 py-20">
            {/* Soft maroon tint background */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-50/70 via-white to-white" />

            <div className="relative container mx-auto px-6 max-w-7xl">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                        Powerful Features for{' '}
                        <span className="text-[#8B1538]">
                            Emergency Management
                        </span>
                    </h2>

                    <p className="mt-4 text-lg text-slate-700 max-w-3xl mx-auto">
                        Comprehensive tools designed to enhance disaster
                        preparedness, response coordination, and community
                        health management.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {features.map((feature, index) => {
                        const Icon = iconMap[feature.title] ?? ShieldCheck;

                        return (
                            <Card
                                key={index}
                                className="
                  h-full
                  rounded-3xl
                  border border-rose-300
                  bg-white
                  shadow-sm
                  transition-all duration-300 ease-out
                  will-change-transform
                  active:scale-[1.01]
                "
                            >
                                <CardBody className="flex flex-col items-center text-center p-10">
                                    {/* Icon (maroon) */}
                                    <div className="mb-6 rounded-2xl bg-rose-50 p-5">
                                        <Icon
                                            className="w-10 h-10"
                                            style={{ color: MAROON }}
                                        />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-slate-700 leading-relaxed max-w-sm">
                                        {feature.description}
                                    </p>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Features;
