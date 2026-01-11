import { useState } from 'react';
import { MapPin, Leaf, Calendar as CalendarIcon, TrendingUp, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { auth } from '../utils/firebaseConfig';
import Groq from "groq-sdk";

const YieldPredictionForm = ({ user, onPredictionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: '',
    acres: 0,
    plantingDate: '',
    harvestDate: '',
    soilType: '',
    irrigationType: '',
    notes: ''
  });

  const [apiPostResponse, setApiPostResponse] = useState(null);

  const [apiGetResponse, setApiGetResponse] = useState({
    uid: "64bca9e1f42aab3472d58fa2", // simulated MongoDB ObjectId reference
    acresOfLand: "3.5",
    cropName: "Rice",
    plantingDate: new Date("2025-06-01"),
    expectedHarvestDate: new Date("2025-10-15"),
    soilType: "Loamy",
    irrigationMethod: "Drip Irrigation",
    additionalNotes: "Field located near river, good access to water.",
    predictedYieldKgPerAcre: 1450,
    yieldCategory: "High",
    soilHealthScore: 82,
    soilHealthCategory: "Excellent",
    climateScore: 76,
    location: {
      lat: 23.1949,
      long: 88.6094
    },
    suggestedCrops: [
      {
        cropName: "Maize",
        predictedYieldKgPerHa: 7200
      },
      {
        cropName: "Wheat",
        predictedYieldKgPerHa: 6500
      },
      {
        cropName: "Sugarcane",
        predictedYieldKgPerHa: 84000
      }
    ]
  });
  const [responseFetched, setResponseFetched] = useState(false);

  const cropOptions = [
    { value: 'wheat', label: 'Wheat', icon: '🌾' },
    { value: 'rice', label: 'Rice', icon: '🌾' },
    { value: 'corn', label: 'Corn', icon: '🌽' },
    { value: 'mustard', label: 'Mustard', icon: '🌻' },
    { value: 'cotton', label: 'Cotton', icon: '🌿' },
    { value: 'sugarcane', label: 'Sugarcane', icon: '🎋' }
  ];

  const soilTypes = [
    { value: 'clay', label: 'Clay Soil' },
    { value: 'sandy', label: 'Sandy Soil' },
    { value: 'loamy', label: 'Loamy Soil' },
    { value: 'silt', label: 'Silt Soil' },
    { value: 'black', label: 'Black Soil' }
  ];

  const irrigationTypes = [
    { value: 'drip', label: 'Drip Irrigation' },
    { value: 'sprinkler', label: 'Sprinkler Irrigation' },
    { value: 'flood', label: 'Flood Irrigation' },
    { value: 'rainfall', label: 'Rainfall Dependent' }
  ];

  const calculateTimespan = () => {
    if (formData.plantingDate && formData.harvestDate) {
      const planting = new Date(formData.plantingDate);
      const harvest = new Date(formData.harvestDate);

      if (harvest > planting) {
        const diffTime = Math.abs(harvest - planting);
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
        return diffMonths;
      }
    }
    return 0;
  };

  const timespan = calculateTimespan();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.cropType || !formData.acres || !formData.plantingDate) {
      alert("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const systemPrompt = `You are an expert agronomist. Analyze the crop and farm data provided and generate a detailed yield prediction. 
        RETURN JSON ONLY. The JSON must match this structure exactly:
        {
          "predictedYieldKgPerAcre": number,
          "yieldCategory": "High" | "Medium" | "Low",
          "soilHealthScore": number (0-100),
          "soilHealthCategory": string,
          "climateScore": number (0-100),
          "suggestedCrops": [ { "cropName": string, "predictedYieldKgPerHa": number } ]
        }`;

      const userPrompt = `
        Crop: ${formData.cropType}
        Acres: ${formData.acres}
        Planting Date: ${formData.plantingDate}
        Harvest Date: ${formData.harvestDate}
        Soil Type: ${formData.soilType}
        Irrigation: ${formData.irrigationType}
        Notes: ${formData.notes}
        Location: ${user.locationLat}, ${user.locationLong}
        `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: false,
        reasoning_effort: "medium",
        stop: null
      });

      const content = chatCompletion.choices[0]?.message?.content || "{}";
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;

      const aiData = JSON.parse(jsonString);

      // Merge AI result with local form data to match expected structure
      const resultData = {
        ...aiData,
        uid: user.uid,
        cropName: formData.cropType,
        acresOfLand: formData.acres,
        plantingDate: new Date(formData.plantingDate),
        expectedHarvestDate: new Date(formData.harvestDate),
        soilType: formData.soilType,
        irrigationMethod: formData.irrigationType,
        additionalNotes: formData.notes,
        location: {
          lat: user.locationLat,
          long: user.locationLong
        }
      };

      console.log("AI Prediction Result:", resultData);
      setApiGetResponse(resultData); // Update local state if needed
      onPredictionComplete(resultData); // Pass to parent for display

    } catch (error) {
      console.error('Error generating prediction:', error);
      alert(`Prediction failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Yield Prediction Request</h1>
        <p className="text-gray-600 font-medium">Provide details about your crop to get accurate yield predictions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-green-50 rounded-t-2xl">
              <h2 className="text-xl font-bold mb-0 flex items-center text-gray-900">
                <Leaf className="h-6 w-6 mr-2 text-green-700" /> Crop Information
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Crop Type *</label>
                  <div className="relative">
                    <select
                      value={formData.cropType}
                      onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    >
                      <option value="">Select crop type</option>
                      {cropOptions.map((crop) => (
                        <option key={crop.value} value={crop.value}>
                          {crop.icon} {crop.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Acres to Evaluate *</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.5"
                    className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400"
                    value={formData.acres}
                    onChange={(e) => setFormData(prev => ({ ...prev, acres: e.target.value }))}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Planting Date *</label>
                    <input
                      type="date"
                      name="plantingDate"
                      value={formData.plantingDate}
                      onChange={handleInputChange}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Expected Harvest Date</label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleInputChange}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                {timespan > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Growing Period
                    </label>
                    <div className="px-3 py-3 bg-gray-50 border-2 border-black rounded-xl">
                      <span className="text-gray-900 font-bold">{timespan} months</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Soil Type</label>
                  <div className="relative">
                    <select
                      value={formData.soilType}
                      onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    >
                      <option value="">Select soil type</option>
                      {soilTypes.map((soil) => (
                        <option key={soil.value} value={soil.value}>{soil.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Irrigation Method</label>
                  <div className="relative">
                    <select
                      value={formData.irrigationType}
                      onChange={(e) => setFormData(prev => ({ ...prev, irrigationType: e.target.value }))}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    >
                      <option value="">Select irrigation method</option>
                      {irrigationTypes.map((irrigation) => (
                        <option key={irrigation.value} value={irrigation.value}>{irrigation.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Additional Notes</label>
                  <textarea
                    className="flex w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400 min-h-[100px]"
                    placeholder="Any additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-black uppercase tracking-wider ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-green-600 text-white h-12 px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Prediction...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <TrendingUp className="mr-2 h-4 w-4" /> Generate Yield Prediction
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black">
              <h2 className="text-xl font-bold mb-0">Farm Information</h2>
            </div>
            <div className="p-6">
              <div className="text-sm space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-900" />
                  <span className="font-bold text-gray-700">{user.locationLat && user.locationLong ? `${user.locationLat}, ${user.locationLong}` : 'Location not set'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 font-medium">Total Land: </span>
                  <span className="font-bold text-gray-900">{user.totalLand || 0} acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Farmer ID: </span>
                  <span className="font-bold text-gray-900">{user.farmerId || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-yellow-50 rounded-t-2xl">
              <h2 className="text-xl font-bold mb-0">How it Works</h2>
            </div>
            <div className="p-6">
              <ol className="list-decimal pl-5 space-y-2 text-sm font-medium text-gray-700">
                <li>Enter your crop and farm details</li>
                <li>AI analyzes weather, soil, and historical data</li>
                <li>Get detailed yield prediction report</li>
                <li>Use report for loan applications</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPredictionForm;