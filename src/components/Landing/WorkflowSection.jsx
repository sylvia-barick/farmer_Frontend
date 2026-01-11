import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Mic, Bot, FileCheck, Banknote } from 'lucide-react';

const WorkflowSection = () => {
    const steps = [
        {
            title: "Speak or Type",
            description: "Just say 'Mujhe loan chahiye' or type in Hindi, English, or Hinglish - our AI understands naturally.",
            icon: Mic,
            color: "bg-blue-500"
        },
        {
            title: "AI Conversation",
            description: "KisaanSathi asks simple questions one-by-one: crop type, amount needed, repayment period - like talking to a friend.",
            icon: Bot,
            color: "bg-purple-500"
        },
        {
            title: "Instant Application",
            description: "Your loan or insurance application is automatically created and submitted. No forms, no paperwork, no bank visits.",
            icon: FileCheck,
            color: "bg-orange-500"
        },
        {
            title: "Quick Approval",
            description: "Get AI-powered eligibility check and fraud scoring. Track your application status anytime through the app.",
            icon: Banknote,
            color: "bg-green-500"
        }
    ];

    return (
        <section className="py-24 bg-[#F8FAFC]">
            <div className="container mx-auto px-6 md:px-12 lg:px-20">
                <div className="mb-16 text-center">
                    <h2 className="text-sm font-bold tracking-wider text-green-600 uppercase mb-4">How It Works</h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-gray-900">
                        From Voice to Approval in Minutes
                    </h3>
                </div>

                <div className="w-full">
                    <Swiper
                        modules={[Pagination, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        loop={true}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        className="pb-16 [&_.swiper-wrapper]:items-stretch"
                    >
                        {steps.map((step, index) => (
                            <SwiperSlide key={index} className="h-auto py-10 px-4 !h-auto">
                                <div className="bg-white rounded-3xl p-8 w-full h-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 justify-between">
                                    <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                                        <step.icon className="w-10 h-10 text-white" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h4>
                                    <p className="text-gray-600 leading-relaxed z-10 relative">
                                        {step.description}
                                    </p>
                                    <div className="absolute -bottom-4 -right-4 text-9xl font-black text-gray-100 z-0 opacity-50 group-hover:text-gray-200 transition-colors select-none">
                                        0{index + 1}
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default WorkflowSection;
