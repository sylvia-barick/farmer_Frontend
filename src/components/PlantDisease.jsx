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

    const handleAnalyze = async () => {
        if (!description && !image) {
            alert("Please provide an image or description of the symptoms.");
            return;
        }

        setIsLoading(true);
        try {
            // Use backend API which uses Llama 4 Maverick
            const result = await identifyDisease(image, description);
            setAnalysis(result);

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
                <button onClick={onBack} className="mb-4 text-agricultural-soil-brown hover:underline flex items-center">
                    &larr; Back to Dashboard
                </button>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden warm-shadow border border-agricultural-stone-gray/20">
                    <div className="p-6 border-b border-agricultural-stone-gray/20 bg-agricultural-forest-green/5">
                        <h2 className="text-2xl font-bold text-agricultural-soil-brown flex items-center">
                            <Leaf className="mr-2 h-6 w-6 text-agricultural-forest-green" />
                            Plant Doctor (Disease Detection)
                        </h2>
                        <p className="text-agricultural-stone-gray text-sm mt-1">
                            Upload a photo or describe symptoms to get instant diagnosis and treatment advice.
                        </p>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-agricultural-soil-brown mb-2">
                                    1. Upload Plant Photo
                                </label>
                                <div className="border-2 border-dashed border-agricultural-stone-gray/30 rounded-lg p-6 text-center hover:bg-agricultural-soft-sand transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="plant-upload"
                                    />
                                    <label htmlFor="plant-upload" className="cursor-pointer">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="mx-auto h-48 object-cover rounded-md" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-10 w-10 text-agricultural-stone-gray mb-2" />
                                                <span className="text-sm text-agricultural-stone-gray">Click to upload photo</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-agricultural-soil-brown mb-2">
                                    2. Describe Symptoms (Optional)
                                </label>
                                <textarea
                                    className="w-full border border-agricultural-stone-gray/30 rounded-md p-3 focus:ring-2 focus:ring-agricultural-forest-green focus:outline-none"
                                    rows="4"
                                    placeholder="e.g., Yellowing leaves with brown spots, wilting despite watering..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                className="w-full bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white font-semibold py-3 rounded-md transition-colors flex items-center justify-center"
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
                        <div className="bg-agricultural-soft-sand rounded-lg p-6 border border-agricultural-stone-gray/10">
                            <h3 className="text-lg font-semibold text-agricultural-soil-brown mb-4 flex items-center">
                                <Info className="mr-2 h-5 w-5" /> Diagnosis Report
                            </h3>

                            {!analysis ? (
                                <div className="h-full flex flex-col items-center justify-center text-agricultural-stone-gray opacity-70">
                                    <Leaf className="h-16 w-16 mb-4 text-gray-300" />
                                    <p>Submit details to generate report</p>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="bg-white p-4 rounded-md border-l-4 border-agricultural-drought-orange shadow-sm">
                                        <h4 className="font-semibold text-agricultural-drought-orange flex items-center mb-2">
                                            Analysis
                                        </h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {analysis}
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-md border-l-4 border-agricultural-crop-green shadow-sm">
                                        <h4 className="font-semibold text-agricultural-crop-green flex items-center mb-2">
                                            <CheckCircle className="h-4 w-4 mr-2" /> Recommendation
                                        </h4>
                                        <p className="text-sm text-gray-700">
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
