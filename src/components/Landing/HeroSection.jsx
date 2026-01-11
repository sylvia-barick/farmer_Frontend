import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Shield, TrendingUp } from 'lucide-react';

const HeroSection = ({ onOpenAuth }) => {
    return (
        <section className="relative w-full min-h-screen bg-[#FDFBF7] overflow-hidden flex items-center">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-green-200/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-yellow-200/20 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100"
                    >
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-gray-600">AI-Powered Agriculture Protocol</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                        Autonomous <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                            Crop Protection
                        </span> <br />
                        & Finance.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-lg leading-relaxed">
                        KisaanSaathi delivers instant, data-driven yield predictions and financial support to farmers worldwide, powered by advanced AI.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={onOpenAuth}
                            className="group px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg flex items-center transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20"
                        >
                            Launch App
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors">
                            Read Documentation
                        </button>
                    </div>

                    <div className="pt-8 flex items-center space-x-8 text-sm font-medium text-gray-500">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            <span>Secure & Audited</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Leaf className="w-5 h-5 text-green-600" />
                            <span>Sustainable</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <span>Yield Optimized</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Content - Diagonal Grid */}
                <div className="relative h-[600px] hidden lg:block perspective-1000">
                    <motion.div
                        initial={{ opacity: 0, rotate: -5, scale: 0.9 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="relative w-full h-full grid grid-cols-2 gap-4 transform rotate-[-6deg] scale-100 p-8"
                    >
                        {/* Card 1: Real-time Analysis */}
                        <motion.div
                            className="rounded-3xl overflow-hidden shadow-2xl relative h-[280px] bg-gray-100"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src="/cropbg1.png" alt="Agriculture Analysis" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                                <span className="text-white font-bold text-lg">Real-time Analysis</span>
                                <span className="text-gray-200 text-sm">AI-driven crop insights</span>
                            </div>
                        </motion.div>

                        {/* Card 2: Yield Prediction (Offset down) */}
                        <motion.div
                            className="rounded-3xl overflow-hidden shadow-2xl relative h-[280px] mt-12 bg-gray-100"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src="/cropbg2.png" alt="Yield Prediction" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                                <span className="text-white font-bold text-lg">Yield Prediction</span>
                                <span className="text-gray-200 text-sm">98% Accuracy Model</span>
                            </div>
                        </motion.div>

                        {/* Card 3: Instant Loans (Offset up) */}
                        <motion.div
                            className="rounded-3xl overflow-hidden shadow-2xl relative h-[280px] -mt-12 bg-gray-100"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src="/cropbg3.png" alt="Financial Support" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                                <span className="text-white font-bold text-lg">Instant Loans</span>
                                <span className="text-gray-200 text-sm">Smart contract disbursement</span>
                            </div>
                        </motion.div>

                        {/* Card 4: Farmers Empowered */}
                        <motion.div
                            className="rounded-3xl overflow-hidden shadow-2xl relative h-[280px] bg-gray-100"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src="/cropbg4.png" alt="Farmers Empowered" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                                <h3 className="text-3xl font-bold text-white mb-1">25K+</h3>
                                <p className="text-gray-200 text-sm">Farmers Empowered</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Floating Badge Removed */}

                </div>
            </div>
        </section>
    );
};

export default HeroSection;
