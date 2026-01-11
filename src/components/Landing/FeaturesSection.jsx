import React from 'react';
import { motion } from 'framer-motion';
import { Mic, CloudRain, Landmark, Bot, ArrowUpRight, Shield } from 'lucide-react';

const FeatureCard = ({ title, description, icon: Icon, color, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`relative overflow-hidden p-8 rounded-3xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-300 bg-white group cursor-pointer h-full`}
        >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-6 h-6 text-gray-700" />
            </div>

            <div className="mb-6 inline-flex p-4 rounded-2xl bg-white shadow-sm">
                <Icon className="w-8 h-8 text-gray-800" strokeWidth={1.5} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
};

const FeaturesSection = () => {
    const features = [
        {
            title: "Voice-First AI",
            description: "Just speak! Our Whisper-powered speech recognition understands Hindi, English, and Hinglish. Apply for loans or claim insurance by talking naturally.",
            icon: Mic,
            color: "bg-red-50 hover:bg-red-100/80",
            delay: 0.2
        },
        {
            title: "Smart Weather Alerts",
            description: "Get location-based weather forecasts with crop-specific advisories. Know when to sow, spray, and harvest for maximum yield.",
            icon: CloudRain,
            color: "bg-blue-50 hover:bg-blue-100/80",
            delay: 0.3
        },
        {
            title: "Instant Loan & Insurance",
            description: "Apply for agricultural loans in 5 minutes through conversation. File insurance claims with step-by-step voice guidance - no paperwork needed.",
            icon: Landmark,
            color: "bg-orange-50 hover:bg-orange-100/80",
            delay: 0.4
        },
        {
            title: "Kisaan Saathi Assistant",
            description: "Your 24/7 farming companion that speaks your language. Get answers about government schemes, crop advice, and market prices instantly.",
            icon: Bot,
            color: "bg-purple-50 hover:bg-purple-100/80",
            delay: 0.5
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6 md:px-12 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 max-w-2xl"
                >
                    <h2 className="text-sm font-bold tracking-wider text-green-600 uppercase mb-4">Key Features</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Banking at your fingertips, in your language.
                    </h3>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
