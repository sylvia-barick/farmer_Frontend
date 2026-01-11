import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Upload, Cpu, FileText, CheckCircle } from 'lucide-react';

const WorkflowSection = () => {
    const steps = [
        {
            title: "Data Input",
            description: "Farmers upload soil data, crop images, or location details via our intuitive mobile interface.",
            icon: Upload,
            color: "bg-blue-500"
        },
        {
            title: "AI Analysis",
            description: "Our multi-model AI engine analyzes the inputs against global agricultural datasets and weather patterns.",
            icon: Cpu,
            color: "bg-purple-500"
        },
        {
            title: "Report Generation",
            description: "Instant generation of comprehensive yield prediction and health status reports.",
            icon: FileText,
            color: "bg-orange-500"
        },
        {
            title: "Actionable Insights",
            description: "Receive personalized recommendations for fertilizers, irrigation, and financial planning.",
            icon: CheckCircle,
            color: "bg-green-500"
        }
    ];

    return (
        <section className="py-24 bg-[#F8FAFC]">
            <div className="container mx-auto px-6 md:px-12 lg:px-20">
                <div className="mb-16 text-center">
                    <h2 className="text-sm font-bold tracking-wider text-green-600 uppercase mb-4">System Workflow</h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-gray-900">
                        From Soil to Success
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
