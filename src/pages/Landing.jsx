import React from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import WorkflowSection from '../components/Landing/WorkflowSection';
import '../App.css'

export default function Landing() {
    return (
        <div className='w-full min-h-screen bg-white'>
            {/* Navbar Container */}
            <div className='fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100'>
                <div className='px-4 md:px-16 py-4'>
                    <Navbar />
                </div>
            </div>

            {/* Main Content */}
            <main>
                <HeroSection />
                <FeaturesSection />
                <WorkflowSection />
            </main>

            {/* Simple Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-6 md:px-12 text-center">
                    <p className="text-gray-400">© 2025 KisaanSaathi. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
