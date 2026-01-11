import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Database, Cpu, Cloud, Smartphone, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ArchitectureNode = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center z-10 relative"
    >
        <div className="w-16 h-16 bg-green-100 rounded-xl border-2 border-black flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-green-700" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </motion.div>
);

const ConnectionLine = ({ vertical = false }) => (
    <div className={`absolute bg-black ${vertical ? 'w-1 h-12 -bottom-12 left-1/2 -translate-x-1/2' : 'h-1 w-12 -right-12 top-1/2 -translate-y-1/2'} hidden md:block z-0`} />
);

const Architecture = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden">
            {/* Navbar Minimal */}
            <nav className="fixed w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link to="/" className="flex items-center space-x-2">
                            <Leaf className="h-8 w-8 text-green-600" />
                            <span className="text-xl font-bold text-gray-900">AgroSure</span>
                        </Link>
                        <Link to="/" className="text-sm font-bold text-gray-900 hover:text-green-600 transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 container mx-auto px-4 md:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Architecture</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        A high-level overview of how AgroSure processes data from the field to provide actionable insights.
                    </p>
                </div>

                {/* Improved Flow Diagram */}
                <div className="max-w-5xl mx-auto relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-y-24">

                        {/* Level 1: Input */}
                        <div className="md:col-span-3 flex justify-center">
                            <div className="relative">
                                <ArchitectureNode
                                    icon={Smartphone}
                                    title="Farmer Interface"
                                    description="Mobile App & Web Platform for data collection (Images, Soil Specs)."
                                    delay={0.1}
                                />
                                {/* Connection to Next Level */}
                                <div className="hidden md:block absolute w-1 h-24 bg-black left-1/2 -translate-x-1/2 -bottom-24" />
                            </div>
                        </div>

                        {/* Level 2: Processing */}
                        <div className="relative flex flex-col items-center">
                            <ArchitectureNode
                                icon={Cloud}
                                title="Data Ingestion"
                                description="Secure AWS/Cloud storage handling raw inputs."
                                delay={0.2}
                            />
                            <div className="hidden md:block absolute h-1 w-full bg-black top-1/2 -z-10 left-1/2" />
                        </div>

                        <div className="relative flex flex-col items-center">
                            <ArchitectureNode
                                icon={Cpu}
                                title="AI Engine"
                                description="Vision Language Model used for Disease Detection and customized LLMs for Yield Prediction."
                                delay={0.3}
                            />
                            {/* Cross connections */}
                            <div className="hidden md:block absolute h-1 w-full bg-black top-1/2 -z-10 right-1/2" />
                            <div className="hidden md:block absolute h-1 w-full bg-black top-1/2 -z-10 left-1/2" />
                        </div>

                        <div className="relative flex flex-col items-center">
                            <ArchitectureNode
                                icon={Database}
                                title="Knowledge Base"
                                description="RAG Vector DB for localized agricultural context."
                                delay={0.4}
                            />
                            <div className="hidden md:block absolute h-1 w-full bg-black top-1/2 -z-10 right-1/2" />
                        </div>

                        {/* Level 3: Output */}
                        <div className="md:col-span-3 flex justify-center mt-12 md:mt-0">
                            <div className="relative">
                                <div className="hidden md:block absolute w-1 h-24 bg-black left-1/2 -translate-x-1/2 -top-24" />
                                <ArchitectureNode
                                    icon={ShieldCheck}
                                    title="Actionable Reports"
                                    description="Instant generation of insights, loan eligibility, and advisory."
                                    delay={0.5}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Tech Stack Section */}
                <div className="mt-32">
                    <h2 className="text-3xl font-bold text-center mb-12">Technology Stack</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {['React + Vite', 'Tailwind CSS', 'Node.js / Express', 'MongoDB', 'TensorFlow / PyTorch', 'Docker', 'Google Translate API', 'Firebase Auth'].map((tech, i) => (
                            <motion.div
                                key={tech}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center font-bold text-gray-800 hover:-translate-y-1 transition-transform"
                            >
                                {tech}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Architecture;
