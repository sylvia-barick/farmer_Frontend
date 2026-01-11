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
      <h1 className="text-3xl font-bold mb-2">Yield Prediction Request</h1>
      <p className="text-gray-600 mb-8">Provide details about your crop to get accurate yield predictions</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="p-6 border shadow rounded">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Leaf className="h-5 w-5 mr-2" /> Crop Information
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-medium mb-1">Crop Type *</label>
                <select
                  value={formData.cropType}
                  onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select crop type</option>
                  {cropOptions.map((crop) => (
                    <option key={crop.value} value={crop.value}>
                      {crop.icon} {crop.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Acres to Evaluate *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.5"
                  className="w-full border px-3 py-2 rounded"
                  value={formData.acres}
                  onChange={(e) => setFormData(prev => ({ ...prev, acres: e.target.value }))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Planting Date *</label>
                  <input
                    type="date"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    name="harvestDate"
                    value={formData.harvestDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {timespan > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Growing Period
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    <span className="text-gray-700 font-medium">{timespan} months</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Soil Type</label>
                <select
                  value={formData.soilType}
                  onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select soil type</option>
                  {soilTypes.map((soil) => (
                    <option key={soil.value} value={soil.value}>{soil.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Irrigation Method</label>
                <select
                  value={formData.irrigationType}
                  onChange={(e) => setFormData(prev => ({ ...prev, irrigationType: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select irrigation method</option>
                  {irrigationTypes.map((irrigation) => (
                    <option key={irrigation.value} value={irrigation.value}>{irrigation.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Additional Notes</label>
                <textarea
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded font-semibold"
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

        <div className="space-y-6">
          <div className="p-6 border shadow rounded">
            <h2 className="text-xl font-semibold mb-4">Farm Information</h2>
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span>{user.locationLat && user.locationLong ? `${user.locationLat}, ${user.locationLong}` : 'Location not set'}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Land: </span>
                <span className="font-semibold">{user.totalLand || 0} acres</span>
              </div>
              <div>
                <span className="text-gray-600">Farmer ID: </span>
                <span className="font-semibold">{user.farmerId || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 border shadow rounded">
            <h2 className="text-xl font-semibold mb-4">How it Works</h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Enter your crop and farm details</li>
              <li>AI analyzes weather, soil, and historical data</li>
              <li>Get detailed yield prediction report</li>
              <li>Use report for loan applications</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPredictionForm;