import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MessageSquare, Loader2, Minimize2, Paperclip, Languages } from "lucide-react";
import { askAI, sendFeedback, identifyDisease, applyLoan, submitInsuranceClaim, submitYieldPrediction } from '../services/backendApi';
import { auth } from '../utils/firebaseConfig';

const KisaanSaathi = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  // Flow State Management
  const [flowState, setFlowState] = useState('IDLE'); // IDLE, LOAN, INSURANCE, YIELD, PLANT_DOCTOR
  const [step, setStep] = useState(0);
  const [flowData, setFlowData] = useState({});
  const [preferredLang, setPreferredLang] = useState('hi'); // Default Hindi

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const toggleLang = () => {
    setPreferredLang(prev => prev === 'hi' ? 'en' : 'hi');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, isOpen]);

  const speakText = (text, ttsUrl, lang = preferredLang === 'hi' ? 'hi-IN' : 'en-US') => {
    if (ttsUrl) {
      const audio = new Audio(ttsUrl);
      audio.play().catch(e => console.warn("TTS Playback failed:", e));
      return;
    }

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

  const addMessage = (query, type, originalQuery = '', attachment = null, ttsUrl = null) => {
    setChats(prev => [...prev, { query, type, originalQuery, attachment, ttsUrl }]);
    if (type === 'response') speakText(query, ttsUrl);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return;

    const currentInput = inputValue;
    const currentFile = attachedFile;

    addMessage(currentInput || (currentFile ? `[File: ${currentFile.name}]` : ''), 'query', '', currentFile);
    setInputValue('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      let responseData = { analysis: "", ttsUrl: null };

      if (flowState !== 'IDLE') {
        const result = await handleFlowInput(currentInput, currentFile);
        responseData.analysis = result;
      } else {
        const intent = detectIntent(currentInput);
        if (intent) {
          startFlow(intent);
          setIsLoading(false);
          return;
        } else {
          responseData = await askAI(currentInput, preferredLang);
        }
      }

      addMessage(responseData.analysis, 'response', currentInput, null, responseData.ttsUrl);

    } catch (error) {
      console.error('Chatbot error:', error);
      addMessage(`❌ Sorry, something went wrong: ${error.message}`, 'response');
    } finally {
      setIsLoading(false);
    }
  };

  const detectIntent = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('loan') || lower.includes('money') || lower.includes('credit')) return 'LOAN';
    if (lower.includes('insurance') || lower.includes('claim') || lower.includes('policy')) return 'INSURANCE';
    if (lower.includes('yield') || lower.includes('harvest') || lower.includes('production')) return 'YIELD';
    if (lower.includes('plant') || lower.includes('disease') || lower.includes('doctor') || lower.includes('crop health')) return 'PLANT_DOCTOR';
    return null;
  };

  const startFlow = (flowName) => {
    setFlowState(flowName);
    setStep(1);
    setFlowData({});

    let prompt = "";
    switch (flowName) {
      case 'LOAN':
        prompt = "🏦 I can help you apply for a loan!\n\nFirst, what is the **purpose** of the loan?\n(e.g., Crop Cultivation, Equipment Purchase, Seeds)";
        break;
      case 'INSURANCE':
        prompt = "🛡️ Let's file an insurance claim.\n\nWhich **Insurance Provider** is your policy with?\n(e.g., AIC, IFFCO Tokio, Bajaj Allianz)";
        break;
      case 'YIELD':
        prompt = "🌾 Let's predict your crop yield!\n\nWhat **type of crop** are you growing?\n(e.g., Rice, Wheat, Cotton)";
        break;
      case 'PLANT_DOCTOR':
        prompt = "🚑 I can diagnose plant diseases.\n\nPlease **upload a photo** of the affected plant using the attachment button (📎).";
        break;
      default:
        prompt = "How can I help you today?";
    }

    setTimeout(() => addMessage(prompt, 'response'), 500);
  };

  const handleFlowInput = async (input, file) => {
    const currentStep = step;
    const lowerInput = input.toLowerCase();

    // Handle cancellation
    if (lowerInput.includes('cancel') || lowerInput.includes('stop') || lowerInput.includes('exit')) {
      setFlowState('IDLE');
      setFlowData({});
      setStep(0);
      return "❌ Process cancelled. How else can I help you?";
    }

    // LOAN FLOW
    if (flowState === 'LOAN') {
      if (currentStep === 1) {
        setFlowData({ ...flowData, purpose: input });
        setStep(2);
        return "What **Crop** is this loan for?";
      }
      if (currentStep === 2) {
        setFlowData({ ...flowData, crop: input });
        setStep(3);
        return "How much **amount** (in ₹) do you need?";
      }
      if (currentStep === 3) {
        const amount = parseFloat(input.replace(/[^\d.]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          return "⚠️ Please enter a valid amount in numbers (e.g., 50000)";
        }
        setFlowData({ ...flowData, amount: amount });
        setStep(4);
        return "For how many **years** repayment period? (1-10 years)";
      }
      if (currentStep === 4) {
        const years = parseInt(input);
        if (isNaN(years) || years < 1 || years > 10) {
          return "⚠️ Please enter a valid number of years between 1 and 10";
        }

        try {
          const loanData = {
            farmerUid: auth.currentUser?.uid || user?.uid,
            loanPurpose: flowData.purpose,
            requestedAmount: flowData.amount,
            tenureMonths: years * 12,
            cropType: flowData.crop,
            landSize: user?.totalLand || user?.landSize || 5
          };

          await applyLoan(loanData);
          setFlowState('IDLE');
          setFlowData({});
          setStep(0);
          return `✅ **Loan Application Submitted Successfully!**\n\n📋 Details:\n💰 Amount: ₹${flowData.amount.toLocaleString('en-IN')}\n🎯 Purpose: ${flowData.purpose}\n🌾 Crop: ${flowData.crop}\n⏱️ Duration: ${years} years\n\nYour application is under review. You'll be notified soon!`;
        } catch (e) {
          console.error('Loan submission error:', e);
          setFlowState('IDLE');
          setFlowData({});
          setStep(0);
          return `❌ **Submission Failed**\n\n${e.message}\nPlease try again or contact support.`;
        }
      }
    }

    // YIELD PREDICTION FLOW
    if (flowState === 'YIELD') {
      if (currentStep === 1) {
        setFlowData({ ...flowData, crop: input });
        setStep(2);
        return "How many **acres** of land?";
      }
      if (currentStep === 2) {
        const acres = parseFloat(input.replace(/[^\d.]/g, ''));
        if (isNaN(acres) || acres <= 0) {
          return "⚠️ Please enter a valid number of acres (e.g., 5 or 2.5)";
        }
        setFlowData({ ...flowData, acres: acres });
        setStep(3);
        return "What is the **soil type**?\n(Clay / Sandy / Loamy / Black)";
      }
      if (currentStep === 3) {
        setFlowData({ ...flowData, soilType: input });
        setStep(4);
        return "What **season** are you planting in?\n(Kharif / Rabi / Zaid)";
      }
      if (currentStep === 4) {
        try {
          const yieldData = {
            crop: flowData.crop,
            area: flowData.acres,
            soilType: flowData.soilType,
            season: input,
            rainfall: 800,
            temperature: 25,
            humidity: 65
          };

          const prediction = await submitYieldPrediction(yieldData);
          setFlowState('IDLE');
          setFlowData({});
          setStep(0);
          return `🌾 **Yield Prediction Results**\n\n${prediction}\n\n📊 Input Data:\n🌱 Crop: ${flowData.crop}\n📏 Area: ${flowData.acres} acres\n🌍 Soil: ${flowData.soilType}\n🌦️ Season: ${input}`;
        } catch (e) {
          console.error('Yield prediction error:', e);
          setFlowState('IDLE');
          setFlowData({});
          setStep(0);
          return `⚠️ **Prediction Failed**\n\n${e.message}\nPlease try again with valid data.`;
        }
      }
    }

    // PLANT DOCTOR FLOW
    if (flowState === 'PLANT_DOCTOR') {
      if (currentStep === 1) {
        if (file) {
          try {
            const diagnosis = await identifyDisease(file, input || "Analyze this plant image and identify any diseases or problems.");
            setFlowState('IDLE');
            setFlowData({});
            setStep(0);
            return `🚑 **Plant Diagnosis Report**\n\n${diagnosis}\n\n💡 **Tip**: Follow the recommendations carefully for best results!`;
          } catch (e) {
            console.error('Disease diagnosis error:', e);
            setFlowState('IDLE');
            setFlowData({});
            setStep(0);
            return `❌ **Diagnosis Failed**\n\n${e.message}\nPlease upload a clear image of the affected plant.`;
          }
        } else {
          return "📷 Please **upload an image** of the affected plant using the attachment button (📎).";
        }
      }
    }

    // INSURANCE CLAIM FLOW
    if (flowState === 'INSURANCE') {
      if (currentStep === 1) {
        setFlowData({ ...flowData, provider: input });
        setStep(2);
        return "What is your **UIN** (Unique Identification Number)?";
      }
      if (currentStep === 2) {
        setFlowData({ ...flowData, uin: input });
        setStep(3);
        return "What is your **Policy Number**?";
      }
      if (currentStep === 3) {
        setFlowData({ ...flowData, policyNumber: input });
        setStep(4);
        return "Please **upload damage photo** using the attachment button (📎)\n\nOr type 'skip' to submit without photo.";
      }
      if (currentStep === 4) {
        if (lowerInput === 'skip' && !file) {
          // Submit without file
          try {
            const fd = new FormData();
            fd.append('uid', auth.currentUser?.uid || user?.uid);
            fd.append('provider', flowData.provider);
            fd.append('uin', flowData.uin);
            fd.append('policyNumber', flowData.policyNumber);

            await submitInsuranceClaim(fd);
            setFlowState('IDLE');
            setFlowData({});
            setStep(0);
            return `✅ **Insurance Claim Submitted!**\n\n📋 Details:\n🏢 Provider: ${flowData.provider}\n🆔 UIN: ${flowData.uin}\n📝 Policy: ${flowData.policyNumber}\n\nYour claim is under review.`;
          } catch (e) {
            console.error('Insurance claim error:', e);
            setFlowState('IDLE');
            setFlowData({});
            setStep(0);
            return `❌ **Claim Failed**\n\n${e.message}`;
          }
        } else if (file) {
          try {
            const fd = new FormData();
            fd.append('uid', auth.currentUser?.uid || user?.uid);
            fd.append('provider', flowData.provider);
            fd.append('uin', flowData.uin);
            fd.append('policyNumber', flowData.policyNumber);
            fd.append('damagePhoto', file);

            await submitInsuranceClaim(fd);
            setFlowState('IDLE');
            setFlowData({});
            setStep(0);
            return `✅ **Insurance Claim Submitted Successfully!**\n\n📋 Details:\n🏢 Provider: ${flowData.provider}\n🆔 UIN: ${flowData.uin}\n📝 Policy: ${flowData.policyNumber}\n📸 Damage Photo: Attached\n\nYour claim is under review. Track status in the Insurance Claims section.`;
          } catch (e) {
            console.error('Insurance claim error:', e);
            setFlowState('IDLE');
            setFlowData({});
            setStep(0);
            return `❌ **Claim Submission Failed**\n\n${e.message}\nPlease try again or submit through the Insurance Claim form.`;
          }
        } else {
          return "Please upload a damage photo or type 'skip' to continue without it.";
        }
      }
    }

    return "I didn't understand that. Can you try again?";
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const r = new window.webkitSpeechRecognition();
      r.lang = preferredLang === 'hi' ? 'hi-IN' : 'en-US';
      r.onstart = () => setIsListening(true);
      r.onresult = (e) => { setInputValue(e.results[0][0].transcript); setIsListening(false); };
      r.onend = () => setIsListening(false);
      r.start();
    } else {
      alert('Speech recognition not supported in your browser');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          <MessageSquare className="h-8 w-8" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[380px] h-[600px] flex flex-col border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 border-b-4 border-black p-4 flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="font-black text-2xl uppercase text-white drop-shadow-lg">🌾 Kisaan Saathi</h3>
              <span
                className="text-[10px] font-black uppercase text-white/90 flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition-colors"
                onClick={toggleLang}
              >
                <Languages className="h-3 w-3" />
                {preferredLang === 'hi' ? 'Hindi (हिन्दी)' : 'English'} - Click to Toggle
              </span>
            </div>
            <button
              onClick={toggleChat}
              className="bg-red-600 text-white p-2 rounded border-2 border-black hover:bg-red-700 transition-colors"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-stone-50 to-stone-100">
            {chats.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="font-bold mb-2">👋 Welcome to Kisaan Saathi!</p>
                <p className="text-sm">I can help you with:</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>🏦 Loan Applications</li>
                  <li>🛡️ Insurance Claims</li>
                  <li>🌾 Yield Predictions</li>
                  <li>🚑 Plant Disease Diagnosis</li>
                  <li>❓ General farming queries</li>
                </ul>
              </div>
            )}
            {chats.map((chat, index) => (
              <div key={index} className={`flex flex-col ${chat.type === 'query' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 font-semibold text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg ${chat.type === 'query'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-black'
                  }`}>
                  <p className="whitespace-pre-wrap">{chat.query}</p>
                  {chat.attachment && (
                    <p className="text-xs mt-1 opacity-75">📎 {chat.attachment.name}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm font-bold text-gray-600">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t-4 border-black">
            {attachedFile && (
              <div className="mb-2 p-2 bg-blue-50 border-2 border-blue-300 rounded flex items-center justify-between">
                <span className="text-xs font-bold truncate">📎 {attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => setAttachedFile(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="p-2 border-2 border-black bg-white hover:bg-gray-100 rounded transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                onClick={startListening}
                className={`p-2 border-2 border-black rounded transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-gray-100'
                  }`}
                title="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 border-2 border-black px-3 py-2 font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-blue-600 text-white p-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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