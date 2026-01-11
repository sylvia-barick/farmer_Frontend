import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MessageCircle, Loader2, ThumbsUp, ThumbsDown, X, MessageSquare, Minimize2, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { askAI, sendFeedback, identifyDisease, applyLoan, submitInsuranceClaim, submitYieldPrediction } from '../services/backendApi';
import { auth } from '../utils/firebaseConfig';
import Groq from "groq-sdk";

const KisaanSaathi = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [hasOpened, setHasOpened] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  // Flow State Management
  const [flowState, setFlowState] = useState('IDLE'); // IDLE, LOAN, INSURANCE, YIELD, PLANT_DOCTOR
  const [step, setStep] = useState(0);
  const [flowData, setFlowData] = useState({});

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasOpened(true);
      setShowPulse(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, isOpen]);

  const speakText = (text, lang = 'hi-IN') => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === lang);
      if (selectedVoice) utterance.voice = selectedVoice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakNow;
    } else {
      speakNow();
    }
  };

  const addMessage = (query, type, originalQuery = '', attachment = null) => {
    setChats(prev => [...prev, { query, type, originalQuery, attachment }]);
    if (type === 'response') speakText(query);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  // --- FLOW LOGIC ---

  const startFlow = (flowName) => {
    setFlowState(flowName);
    setStep(1);
    setFlowData({});

    let prompt = "";
    switch (flowName) {
      case 'LOAN':
        prompt = "I can help you apply for a loan. First, what is the **purpose** of the loan? (e.g., Crop Cultivation, Equipment)";
        break;
      case 'INSURANCE':
        prompt = "For insurance claims, I need a few details. Which **Insurance Provider** is your policy with?";
        break;
      case 'YIELD':
        prompt = "Let's predict your crop yield. What **type of crop** are you growing?";
        break;
      case 'PLANT_DOCTOR':
        prompt = "I can diagnose plant diseases. Please **upload a photo** of the affected plant. (Optional: Add a description)";
        break;
      default:
        prompt = "How can I help you?";
    }

    setTimeout(() => addMessage(prompt, 'response'), 500);
  };

  const executeYieldPredictionGroq = async (data) => {
    // Direct call to Groq similar to YieldPredictionForm
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
    const userPrompt = `Crop: ${data.crop}, Acres: ${data.acres}, Planting Date: ${data.plantingDate}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 1,
      max_completion_tokens: 4096,
    });
    const content = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    return JSON.parse(jsonString);
  };

  const handleFlowInput = async (input, file) => {
    const currentStep = step;

    // -- LOAN FLOW --
    if (flowState === 'LOAN') {
      if (currentStep === 1) { // Purpose
        setFlowData({ ...flowData, purpose: input });
        setStep(2);
        return "Which **Crop** is this loan for? (e.g., Wheat, Rice)";
      } else if (currentStep === 2) { // Crop
        setFlowData({ ...flowData, crop: input });
        setStep(3);
        return "Got it. How much **amount** (in ₹) do you need?";
      } else if (currentStep === 3) { // Amount
        setFlowData({ ...flowData, amount: input });
        setStep(4);
        return "And for how many **years** (tenure)?";
      } else if (currentStep === 4) { // Tenure -> Submit
        console.log("Submitting Loan. User Data:", user);

        const loanPayload = {
          farmerUid: auth.currentUser?.uid,
          farmerName: auth.currentUser?.displayName || user?.name || "Farmer",
          loanPurpose: flowData.purpose,
          requestedAmount: Number(flowData.amount),
          tenureMonths: parseInt(input) * 12 || 12,
          cropType: flowData.crop || "General",
          acres: user?.totalLand || 0,
          farmLocation: {
            lat: Number(user?.locationLat) || 22.5726,
            lng: Number(user?.locationLong) || 88.3639
          }
        };

        console.log("Loan Payload:", loanPayload);

        try {
          await applyLoan(loanPayload);
          setFlowState('IDLE');
          return `✅ **Loan Application Submitted!**\n\nI have successfully submitted your application for **₹${flowData.amount}** for **${flowData.crop}** cultivation.\n\nYou can track the status in your Dashboard.`;
        } catch (e) {
          console.error("Loan Submission Error:", e);
          setFlowState('IDLE');
          const errorMsg = e.response?.data?.message || e.message || "Unknown error";
          return `❌ **Submission Failed**\n\nError: ${errorMsg}\n\nPlease try applying directly from the Loan page.`;
        }
      }
    }

    // -- YIELD FLOW --
    if (flowState === 'YIELD') {
      if (currentStep === 1) { // Crop
        setFlowData({ ...flowData, crop: input });
        setStep(2);
        return "How many **acres** of land?";
      } else if (currentStep === 2) {
        setFlowData({ ...flowData, acres: input });
        setStep(3);
        return "When did you **plant** the crop? (e.g., 2024-06-01)";
      } else if (currentStep === 3) {
        try {
          // Call Groq AI for prediction
          const result = await executeYieldPredictionGroq({
            crop: flowData.crop,
            acres: flowData.acres,
            plantingDate: input
          });

          setFlowState('IDLE');
          return `🌾 **Yield Prediction Report**\n\n**Expected Yield:** ${result.predictedYieldKgPerAcre} kg/acre\n**Category:** ${result.yieldCategory}\n**Soil Health:** ${result.soilHealthCategory} (${result.soilHealthScore}%)\n**Climate Score:** ${result.climateScore}%\n\nI recommend planting **${result.suggestedCrops?.[0]?.cropName || 'similar crops'}** next season for better results.`;
        } catch (e) {
          setFlowState('IDLE');
          return "⚠️ I couldn't generate the yield report right now. Please try the Yield Prediction page.";
        }
      }
    }

    // -- PLANT DOCTOR FLOW --
    if (flowState === 'PLANT_DOCTOR') {
      if (currentStep === 1) {
        if (file) {
          setIsLoading(true);
          try {
            const result = await identifyDisease(file, input || "Check for disease");
            setFlowState('IDLE');
            setIsLoading(false);
            return `🚑 **Plant Diagnosis Report**\n\n${result}\n\nI have recorded this diagnosis. View full details in the Plant Doctor section.`;
          } catch (e) {
            setFlowState('IDLE');
            setIsLoading(false);
            return "❌ Failed to diagnose. Please check your internet connection or try a different image.";
          }
        } else {
          return "Please upload an image for diagnosis.";
        }
      }
    }

    // -- INSURANCE FLOW --
    if (flowState === 'INSURANCE') {
      if (currentStep === 1) {
        setFlowData({ ...flowData, provider: input });
        setStep(2);
        return "What is your **Policy Number**?";
      } else if (currentStep === 2) {
        setFlowData({ ...flowData, policyNumber: input });
        setStep(3);
        return "Please **upload your Policy Document** (or just type 'skip' if you don't have it handy).";
      } else if (currentStep === 3) {
        const formData = new FormData();
        formData.append('uid', auth.currentUser?.uid);
        formData.append('provider', flowData.provider);
        formData.append('policyNumber', flowData.policyNumber);
        formData.append('uin', 'N/A-CHATBOT'); // Default
        if (file) formData.append('policyDoc', file);

        try {
          await submitInsuranceClaim(formData);
          setFlowState('IDLE');
          return `✅ **Insurance Claim Submitted!**\n\nClaim for **${flowData.provider}** (Policy: ${flowData.policyNumber}) has been filed.\n\nOur team will review the documents.`;
        } catch (e) {
          setFlowState('IDLE');
          return "❌ Submission Failed. Please ensure all details are correct or try later.";
        }
      }
    }

    return "I didn't catch that. Can you repeat?";
  };

  const detectIntent = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('loan') || lower.includes('money') || lower.includes('credit')) return 'LOAN';
    if (lower.includes('insurance') || lower.includes('claim') || lower.includes('policy')) return 'INSURANCE';
    if (lower.includes('yield') || lower.includes('harvest') || lower.includes('production')) return 'YIELD';
    if (lower.includes('plant') || lower.includes('disease') || lower.includes('sick') || lower.includes('doctor')) return 'PLANT_DOCTOR';
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return;

    const currentInput = inputValue;
    const currentFile = attachedFile;

    addMessage(currentInput, 'query', '', currentFile);
    setInputValue('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      let responseText = "";

      if (flowState !== 'IDLE') {
        responseText = await handleFlowInput(currentInput, currentFile);
      } else {
        const intent = detectIntent(currentInput);
        if (intent) {
          startFlow(intent);
          setIsLoading(false);
          return;
        } else {
          const query_text = await translateHindiToEnglish(currentInput);
          const answer = await askAI(query_text);
          responseText = await translateEnglishToHindi(answer);
        }
      }

      addMessage(responseText, 'response', currentInput);

    } catch (error) {
      addMessage("Sorry, something went wrong. Please try again.", 'response');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Translation Helpers ---
  const translateHindiToEnglish = async (text) => {
    if (!text) return '';
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0]?.map((part) => part[0]).join('') || '';
    } catch { return text; }
  };

  const translateEnglishToHindi = async (text) => {
    if (!text) return '';
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0]?.map((part) => part[0]).join('') || '';
    } catch { return text; }
  };

  // --- Speech ---
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'hi-IN';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event) => {
        setInputValue(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition not supported');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleFeedback = async (originalQuery, rating) => {
    await sendFeedback(originalQuery, rating);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">

      {/* Launch Button */}
      {!isOpen && (
        <button onClick={toggleChat} className="relative group">
          <div className={`absolute -inset-2 bg-yellow-400 border-4 border-black ${showPulse ? 'animate-ping opacity-75' : 'opacity-0'}`}></div>
          <div className="relative bg-blue-600 hover:bg-red-600 text-white p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center">
            <MessageSquare className="h-8 w-8" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] flex flex-col border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-10 fade-in duration-300">

          {/* Header */}
          <div className="bg-yellow-400 border-b-4 border-black p-4 flex justify-between items-center select-none">
            <div className="flex items-center gap-3">
              <div className="bg-black p-1.5 border-2 border-white">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tighter text-black leading-none">Kisaan Saathi</h3>
                <span className="text-xs font-bold text-black border-t-2 border-black pt-0.5 inline-block mt-0.5 uppercase">
                  {flowState === 'IDLE' ? 'AI Assistant' : `${flowState.replace('_', ' ')} MODE`}
                </span>
              </div>
            </div>
            <button onClick={toggleChat} className="bg-red-600 text-white p-1 hover:bg-black border-2 border-black transition-colors">
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-100 custom-scrollbar relative">
            {chats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                <MessageCircle className="h-16 w-16 text-stone-400 mb-4" />
                <p className="font-black text-2xl text-stone-400 uppercase">Start Chatting</p>
                <p className="font-bold text-stone-400 text-sm mb-4">Try: "Apply for Loan" or "Check Plant Disease"</p>
              </div>
            ) : (
              chats.map((chat, index) => (
                <div key={index} className={`flex flex-col ${chat.type === 'query' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${chat.type === 'query' ? 'bg-blue-600 text-white rounded-none ml-8' : 'bg-white text-black rounded-none mr-8'
                    }`}>
                    {chat.attachment && (
                      <div className="mb-2 p-1 bg-black/20 rounded text-xs flex items-center gap-2">
                        <Paperclip className="h-3 w-3" /> {chat.attachment.name}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{chat.query}</p>
                  </div>
                  {chat.type === 'response' && (
                    <div className="flex gap-2 mt-1 ml-1 scale-75 origin-left opacity-0 animate-in fade-in duration-300 fill-mode-forwards" style={{ animationDelay: '0.3s' }}>
                      <button onClick={() => handleFeedback(chat.originalQuery, 5)} className="p-1 hover:bg-green-200 border border-black bg-white"><ThumbsUp className="h-3 w-3" /></button>
                      <button onClick={() => handleFeedback(chat.originalQuery, 1)} className="p-1 hover:bg-red-200 border border-black bg-white"><ThumbsDown className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start w-full">
                <div className="bg-yellow-400 border-2 border-black p-3 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-black text-xs uppercase">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t-4 border-black">
            {attachedFile && (
              <div className="flex items-center justify-between bg-stone-100 p-2 mb-2 border-2 border-dashed border-black">
                <span className="text-xs font-bold truncate max-w-[200px]">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)}><X className="h-4 w-4 text-red-600" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-stone-100 transition-all bg-white"
                title="Upload File"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <button
                onClick={startListening}
                className={`p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white hover:bg-stone-100'}`}
              >
                <Mic className="h-5 w-5" />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={flowState === 'PLANT_DOCTOR' && step === 1 ? "Upload photo..." : "Type a message..."}
                className="flex-1 border-2 border-black px-3 font-bold text-sm focus:outline-none focus:bg-yellow-50 placeholder:text-stone-400"
                disabled={isListening}
              />

              <button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && !attachedFile) || isLoading}
                className="bg-black text-white p-3 border-2 border-black hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KisaanSaathi;