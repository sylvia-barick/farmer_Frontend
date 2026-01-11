import { useState } from 'react';
import { Leaf, Upload, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { identifyDisease } from '../services/backendApi';

const PlantDisease = ({ onBack }) => {
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Helper to convert file to base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // Helper to read chunks from stream
    const readStream = async (stream) => {
        let fullResponse = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            setAnalysis((prev) => (prev ? prev + content : content)); // Stream update
        }
        return fullResponse;
    };

    const handleAnalyze = async () => {
        if (!image) { // removed description check as it is optional now
            if (!description) {
                // logic to allow just image
            }
        }

        if (!image && !description) {
            alert("Please provide an image or description.");
            return;
        }

        setIsLoading(true);
        setAnalysis(""); // Reset previous analysis

        try {
            // Direct Groq Call as requested
            const Groq = (await import("groq-sdk")).Groq;
            const groq = new Groq({
                apiKey: import.meta.env.VITE_GROQ_API_KEY,
                dangerouslyAllowBrowser: true
            });

            // Convert image to base64 if present
            let imageContent = null;
            if (image) {
                const base64Image = await toBase64(image);
                imageContent = {
                    type: "image_url",
                    image_url: { url: base64Image }
                };
            }

            const messages = [
                {
                    role: "user",
                    content: imageContent
                        ? [
                            { type: "text", text: description || "Analyze this plant image for diseases." },
                            imageContent
                        ]
                        : description
                }
            ];

            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "meta-llama/llama-4-maverick-17b-128e-instruct",
                temperature: 1,
                max_completion_tokens: 1024,
                top_p: 1,
                stream: true,
                stop: null
            });

            await readStream(chatCompletion);

        } catch (error) {
            console.error("Analysis failed:", error);
            alert(`Failed to analyze: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-agricultural-soft-sand p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={onBack}
                    className="mb-6 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 px-4 py-2 text-gray-900 transition-all"
                >
                    &larr; Back to Dashboard
                </button>

                <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="p-6 border-b-2 border-black bg-green-50">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center">
                            <Leaf className="mr-3 h-8 w-8 text-green-700" />
                            Plant Doctor (Disease Detection)
                        </h2>
                        <p className="text-gray-600 font-medium text-sm mt-2 ml-1">
                            Upload a photo or describe symptoms to get instant diagnosis and treatment advice.
                        </p>
                    </div>

                    <div className="p-8 grid md:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    1. Upload Plant Photo
                                </label>
                                <div className="border-2 border-dashed border-black rounded-xl p-6 text-center hover:bg-gray-50 transition-colors bg-white relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        id="plant-upload"
                                    />
                                    <div className="relative z-0">
                                        {previewUrl ? (
                                            <div className="relative">
                                                <img src={previewUrl} alt="Preview" className="mx-auto h-48 w-full object-cover rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <span className="text-white font-bold bg-black px-3 py-1 rounded-md">Change Photo</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center py-8">
                                                <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-black flex items-center justify-center mb-4">
                                                    <Upload className="h-8 w-8 text-green-700" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">Click to upload photo</span>
                                                <span className="text-xs text-gray-500 mt-1">Supports JPG, PNG</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    2. Describe Symptoms (Optional)
                                </label>
                                <textarea
                                    className="w-full border-2 border-black rounded-xl p-4 text-sm font-medium focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all focus:outline-none placeholder:text-gray-400 min-h-[120px]"
                                    placeholder="e.g., Yellowing leaves with brown spots, wilting despite watering..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                className="w-full bg-green-600 text-white font-black uppercase tracking-wider py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center text-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-5 w-5" /> Diagnosing...
                                    </>
                                ) : (
                                    <>
                                        <Leaf className="mr-2 h-5 w-5" /> Diagnose Plant
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Results Section */}
                        <div className="bg-gray-50 rounded-2xl p-6 border-2 border-black h-full">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-b-2 border-black pb-2">
                                <Info className="mr-2 h-5 w-5" /> Diagnosis Report
                            </h3>

                            {!analysis ? (
                                <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                                    <Leaf className="h-20 w-20 mb-4 opacity-20" />
                                    <p className="font-bold text-center">Submit details to<br />generate analysis report</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,146,60,1)]">
                                        <h4 className="font-bold text-orange-600 flex items-center mb-3 uppercase tracking-wider text-xs">
                                            <AlertTriangle className="h-4 w-4 mr-2" /> Analysis
                                        </h4>
                                        <p className="text-sm text-gray-900 font-medium leading-relaxed">
                                            {analysis}
                                        </p>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(74,222,128,1)]">
                                        <h4 className="font-bold text-green-600 flex items-center mb-3 uppercase tracking-wider text-xs">
                                            <CheckCircle className="h-4 w-4 mr-2" /> Recommendation
                                        </h4>
                                        <p className="text-sm text-gray-900 font-medium leading-relaxed">
                                            Based on the AI diagnosis, please follow the suggested treatment plan. If symptoms persist, consult a local extension officer.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlantDisease;
