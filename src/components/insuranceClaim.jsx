import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Upload, FileText, Camera, CheckCircle } from "lucide-react";
import AiPredictionResults from './AiPredictionResults';
import { auth } from '../utils/firebaseConfig';
import { analyzePolicy } from '../services/backendApi';
import ReactMarkdown from 'react-markdown';
// Assuming this is a custom hook and not a ShadCN component


const InsuranceClaim = ({ user, onBack }) => {
  const [formData, setFormData] = useState({
    provider: '',
    uin: '',
    policyNumber: '',
    policyDocument: null,
    damageImage: null,
    fieldImage: null
  });

  const [showAiResults, setShowAiResults] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState('');
  const [apiResponse, setApiResponse] = useState({
    // From /api/exif_metadata
    address: "Ranaghat, Ranaghat - II, Nadia, West Bengal, 741200, India",
    authenticity_score: 60,
    device_model: "Galaxy S23 FE",
    gps_latitude: 23.194992,
    gps_longitude: 88.609428,
    suspicious_reasons: [
      "Image was edited using software: S711BXXS6DXK8",
      "High ELA deviation — possible image tampering."
    ],
    timestamp: "2025:02:03 11:50:04",
    verifier_exif: "exif_metadata_reader",
    // From /api/damage_detection
    class_names: ["damaged", "non_damaged"],
    damage_confidence: 99.03,
    damage_prediction: "damaged",
    damage_model: "efficientnetv2_rw_m",
    status_damage_detection: "success",
    verifier_damage: "crop_damage_classifier",
    // From /api/crop_type
    crop_confidence_percent: 97.01,
    predicted_crop_class: "sugarcane",
    status_crop_type: "success"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const speakText = (text, lang = 'hi-IN') => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech Synthesis not supported or text is empty.');
      return;
    }

    text = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      window.speechSynthesis.getVoices().forEach(voice => {
        console.log(`${voice.name} [${voice.lang}]`);
      });
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === lang);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.cancel(); // Stop current speech
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      // Wait for voices to load before speaking
      window.speechSynthesis.onvoiceschanged = () => {
        speakNow();
      };
    } else {
      speakNow();
    }
  };


  useEffect(() => {
    speakText(geminiResponse);
  }, [geminiResponse]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Form data updated:", formData);

    try {
      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();
      // Add text fields
      formDataToSend.append('uid', auth.currentUser.uid);
      formDataToSend.append('provider', formData.provider);
      formDataToSend.append('uin', formData.uin);
      formDataToSend.append('policyNumber', formData.policyNumber);

      // Add file fields if they exist
      if (formData.policyDocument) {
        formDataToSend.append('policyDoc', formData.policyDocument);
      }
      if (formData.damageImage) {
        formDataToSend.append('damageImage', formData.damageImage);
      }
      if (formData.cropImage) {
        formDataToSend.append('cropImage', formData.cropImage);
      }
      if (formData.fieldImage) {
        formDataToSend.append('fieldImage', formData.fieldImage);
      }

      // Log FormData contents before sending
      console.log("Multipart form data fields:");
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/insurance/create`, {
        method: 'POST',
        body: formDataToSend // FormData automatically sets the correct Content-Type header
      });

      if (!response.ok) {
        throw new Error('Failed to submit claim');
      }

      const data = await response.json();
      console.log('Claim submitted successfully:', data);

      // Optionally reset form
      setFormData({
        provider: '',
        uin: '',
        policyNumber: '',
        policyDocument: null,
        damageImage: null,
        cropImage: null
      });

    } catch (e) {
      console.error('Error submitting claim:', e);
      alert('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field, file) => {
    if (file) {
      // Create a new File object with the original file data
      const newFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });

      setFormData(prev => ({
        ...prev,
        [field]: newFile
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };



  const handleAiPrediction = async () => {
    setIsLoadingAi(true);
    setGeminiResponse('');
    try {
      // Check if a policy document is uploaded
      if (!formData.policyDocument) {
        alert("Upload a policy document to continue!");
        return;
      }

      let textToAnalyze = "";

      // Check if it's a text file
      if (formData.policyDocument.type.includes('text') || formData.policyDocument.name.endsWith('.txt')) {
        console.log("Processing text file: ", formData.policyDocument);

        // Helper to read text
        const readText = (file) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsText(file);
        });

        textToAnalyze = await readText(formData.policyDocument);
      }
      // Check for images - compress before sending
      else if (formData.policyDocument.type.startsWith('image/')) {
        console.log("Processing image file: ", formData.policyDocument);

        // Compress image to reduce size and avoid 413 errors
        const compressImage = (file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxWidth = 800;
              const maxHeight = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > maxWidth) {
                  height *= maxWidth / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width *= maxHeight / height;
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              resolve(compressedBase64);
            };
            img.onerror = reject;
          };
          reader.onerror = reject;
        });

        const compressedImage = await compressImage(formData.policyDocument);

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'policy-summary',
            data: {
              policyText: "Analyze this insurance policy document from the image.",
              image: compressedImage
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to analyze');
        }
        const data = await response.json();
        setGeminiResponse(data.analysis);
        return;
      }
      // Handle PDF files with helpful message
      else if (formData.policyDocument.type === 'application/pdf' || formData.policyDocument.name.endsWith('.pdf')) {
        console.log("PDF detected - showing guidance");

        setGeminiResponse(`📄 **PDF Document Detected**

Unfortunately, direct PDF analysis is limited due to file size constraints.

**Alternative Options:**
1. **Convert to Image**: Screenshot your policy and upload as JPG/PNG
2. **Copy as Text**: Copy policy text and save as .txt file
3. **Manual Review**: Review policy manually

**Your Policy Details:**
- Provider: ${formData.provider || 'N/A'}
- Policy #: ${formData.policyNumber || 'N/A'}
- UIN: ${formData.uin || 'N/A'}

Try uploading an image version for AI analysis!`);
        return;
      }

      if (textToAnalyze) {
        // Use Backend API (Llama 4 Maverick) for text files
        const response = await analyzePolicy(textToAnalyze);
        setGeminiResponse(response);
      } else {
        setGeminiResponse('Could not extract text from document. Please upload a text file, PDF, or image.');
      }

    } catch (error) {
      console.error('Error processing document:', error);
      setGeminiResponse(`Failed to process the policy document: ${error.message}. Please try again.`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-agricultural-soft-sand p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 px-4 py-2 text-gray-900 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Insurance Claim
          </h1>
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            File a crop insurance claim for damages or losses
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Insurance Claim Form */}
          <div className="xl:col-span-1 order-1 xl:order-1">
            <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-green-50 rounded-t-2xl">
                <h3 className="flex items-center text-xl font-black text-gray-900">
                  <Shield className="h-6 w-6 mr-2 text-green-700" />
                  Claim Details
                </h3>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="provider" className="block text-sm font-bold text-gray-900 mb-2">
                      Insurance Provider
                    </label>
                    <div className="relative">
                      <select
                        id="provider"
                        value={formData.provider}
                        onChange={(e) => handleChange('provider', e.target.value)}
                        className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                      >
                        <option value="" disabled hidden>Select insurance provider</option>
                        <option value="aic">Agriculture Insurance Company of India (AIC)</option>
                        <option value="iffco-tokio">IFFCO Tokio General Insurance</option>
                        <option value="bajaj-allianz">Bajaj Allianz General Insurance</option>
                        <option value="hdfc-ergo">HDFC ERGO General Insurance</option>
                        <option value="tata-aig">Tata AIG General Insurance</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="uin" className="block text-sm font-bold text-gray-900 mb-2">
                      UIN (Unique Identification Number)
                    </label>
                    <input
                      id="uin"
                      type="text"
                      placeholder="Enter UIN"
                      value={formData.uin}
                      onChange={(e) => handleChange('uin', e.target.value)}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="policyNumber" className="block text-sm font-bold text-gray-900 mb-2">
                      Policy Number
                    </label>
                    <input
                      id="policyNumber"
                      type="text"
                      placeholder="Enter policy number"
                      value={formData.policyNumber}
                      onChange={(e) => handleChange('policyNumber', e.target.value)}
                      className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b-2 border-black pb-2">Required Documents</h3>

                    <div>
                      <label htmlFor="policyDocument" className="block text-sm font-bold text-gray-900 mb-2">
                        Policy Document (Text file for AI analysis)
                      </label>
                      <div className="border-2 border-dashed border-black rounded-xl p-4 hover:bg-gray-50 transition-colors bg-white relative group">
                        <input
                          id="policyDocument"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.txt"
                          onChange={(e) => handleFileChange('policyDocument', e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center space-x-3 text-gray-600">
                          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-700" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold">{formData.policyDocument ? formData.policyDocument.name : 'Upload Policy Document'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="damageImage" className="block text-sm font-bold text-gray-900 mb-2">
                        Damage Image
                      </label>
                      <div className="border-2 border-dashed border-black rounded-xl p-4 hover:bg-gray-50 transition-colors bg-white relative group">
                        <input
                          id="damageImage"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange('damageImage', e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center space-x-3 text-gray-600">
                          <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                            <Camera className="h-5 w-5 text-red-700" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold">{formData.damageImage ? formData.damageImage.name : 'Upload Damage Image'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fieldImage" className="block text-sm font-bold text-gray-900 mb-2">
                        Field Image
                      </label>
                      <div className="border-2 border-dashed border-black rounded-xl p-4 hover:bg-gray-50 transition-colors bg-white relative group">
                        <input
                          id="fieldImage"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange('fieldImage', e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center space-x-3 text-gray-600">
                          <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                            <Upload className="h-5 w-5 text-green-700" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold">{formData.fieldImage ? formData.fieldImage.name : 'Upload Field Image'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4'>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-black uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-green-600 text-white h-12 px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      )}
                      Submit Insurance Claim
                    </button>

                    <button
                      type="button"
                      onClick={handleAiPrediction}
                      disabled={isLoadingAi}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-black uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-yellow-500 text-black border-2 border-black h-12 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      {isLoadingAi ? 'Analyzing Policy...' : 'Analyze Policy with AI'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className='xl:col-span-1 order-2 xl:order-2'>
            {/* Gemini response div */}
            <div className='rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] h-fit max-h-full min-h-[300px] sm:min-h-[400px] overflow-hidden flex flex-col'>
              <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-yellow-50 rounded-t-2xl">
                <h3 className='text-xl sm:text-2xl font-black leading-none tracking-tight text-gray-900'>
                  Know your policy
                </h3>
              </div>

              <div className='flex flex-col h-full p-6 overflow-y-auto'>
                {geminiResponse !== '' ? (
                  <div className='p-4 bg-gray-50 border-2 border-black rounded-xl'>
                    <div className="text-gray-900 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      <ReactMarkdown>{geminiResponse}</ReactMarkdown>
                    </div>
                  </div>)
                  : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                      <FileText className="h-16 w-16 mb-4 opacity-20" />
                      <h1 className="text-gray-500 text-sm sm:text-base font-bold text-center px-4 max-w-xs">
                        Upload a text file and click "Analyze Policy with AI" to get a summary
                      </h1>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prediction Results Modal */}
      {showAiResults && (
        <AiPredictionResults
          apiResponse={{
            crop: apiResponse.predicted_crop_class || 'Unknown Crop',
            acres: user?.totalLand || 0,
            predictedYield: (user?.totalLand || 0) * (2.5 + Math.random() * 1.5),
            confidenceScore: apiResponse.damage_confidence || 85,
            marketPrice: Math.floor(2000 + Math.random() * 1000),
            riskFactors: [
              {
                factor: 'Image Authenticity',
                score: apiResponse.authenticity_score || 60,
                status: apiResponse.authenticity_score >= 80 ? 'excellent' : apiResponse.authenticity_score >= 60 ? 'good' : 'moderate'
              },
              {
                factor: 'Damage Detection',
                score: apiResponse.damage_confidence || 99,
                status: 'excellent'
              },
              {
                factor: 'Crop Classification',
                score: apiResponse.crop_confidence_percent || 97,
                status: 'excellent'
              },
              {
                factor: 'Location Verification',
                score: apiResponse.gps_latitude && apiResponse.gps_longitude ? 95 : 50,
                status: apiResponse.gps_latitude && apiResponse.gps_longitude ? 'excellent' : 'moderate'
              }
            ],
            recommendations: [
              'Verify image authenticity before proceeding with claim',
              'Ensure all required documents are properly uploaded',
              'Contact insurance provider for additional verification if needed',
              'Monitor claim status regularly through the portal'
            ],
            weatherIndex: 85,
            location: apiResponse.address || 'Location not available',
            farmerId: user?.farmerId || 'Not set',
            generatedAt: new Date().toISOString(),
            projectedRevenue: 0,
            riskIndex: 0
          }}
          onClose={() => setShowAiResults(false)}
        />
      )}
    </div>
  );
};

export default InsuranceClaim;
