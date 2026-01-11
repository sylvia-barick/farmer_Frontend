import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MessageSquare, Loader2, Minimize2, Paperclip, Languages, Volume2 } from "lucide-react";
import { chatWithMastra, transcribeAudio, synthesizeSpeech } from '../services/backendApi';
import { auth } from '../utils/firebaseConfig';

const KisaanSaathi = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [threadId, setThreadId] = useState(null); // For Mastra conversation continuity
  const [preferredLang, setPreferredLang] = useState('hinglish'); // Default Hinglish (mix of Hindi/English)
  const [useTTS, setUseTTS] = useState(true); // Enable ElevenLabs TTS by default

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Language names for display
  const langLabels = {
    hi: 'हिंदी',
    en: 'English',
    hinglish: 'Hinglish'
  };

  const toggleLang = () => {
    // Cycle through: hinglish -> hi -> en -> hinglish
    setPreferredLang(prev => {
      if (prev === 'hinglish') return 'hi';
      if (prev === 'hi') return 'en';
      return 'hinglish';
    });
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

  /**
   * Speak text using ElevenLabs TTS or fallback to browser TTS
   */
  const speakText = async (text, ttsData = null) => {
    if (!text) return;
    
    // Clean text for TTS
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/[📋💰🌾🛡️🌤️✅❌🔄🙏👋🏦🚑]/g, '') // Remove emojis
      .substring(0, 500); // Limit length for TTS
    
    // If we have audio data from ElevenLabs, use it
    if (ttsData?.audio) {
      try {
        setIsSpeaking(true);
        const audio = new Audio(ttsData.audio);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          fallbackToWebSpeechTTS(cleanText);
        };
        await audio.play();
        return;
      } catch (e) {
        console.warn("ElevenLabs playback failed, using fallback:", e);
      }
    }
    
    // Try ElevenLabs API
    if (useTTS) {
      try {
        setIsSpeaking(true);
        const result = await synthesizeSpeech(cleanText, preferredLang, 'female');
        
        if (result.success && result.audio) {
          const audio = new Audio(result.audio);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => {
            setIsSpeaking(false);
            fallbackToWebSpeechTTS(cleanText);
          };
          await audio.play();
          return;
        }
      } catch (e) {
        console.warn("ElevenLabs TTS failed:", e);
      }
    }
    
    // Fallback to browser TTS
    fallbackToWebSpeechTTS(cleanText);
  };
  
  /**
   * Fallback to browser's Web Speech API for TTS
   */
  const fallbackToWebSpeechTTS = (text) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = (preferredLang === 'hi' || preferredLang === 'hinglish') ? 'hi-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.lang === utterance.lang);
    if (selectedVoice) utterance.voice = selectedVoice;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
  
  /**
   * Stop current speech
   */
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const addMessage = (query, type, originalQuery = '', attachment = null, ttsData = null) => {
    setChats(prev => [...prev, { query, type, originalQuery, attachment, ttsData }]);
    if (type === 'response' && useTTS) {
      speakText(query, ttsData);
    }
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
      // Always use Mastra agent - it handles all workflows and conversations intelligently
      const userId = auth.currentUser?.uid || user?.uid || 'anonymous';
      
      // If there's an attached file, include it in the message
      let messageContent = currentInput;
      if (currentFile) {
        // TODO: Convert image to base64 and send with message for plant disease detection
        messageContent += `\n[User attached file: ${currentFile.name}]`;
      }
      
      const mastraResponse = await chatWithMastra(messageContent, userId, threadId, preferredLang);
      
      let responseText = '';
      if (mastraResponse.success) {
        responseText = mastraResponse.response;
        // Update threadId for conversation continuity
        if (mastraResponse.threadId) {
          setThreadId(mastraResponse.threadId);
        }
      } else {
        responseText = mastraResponse.response || "I apologize, but I'm unable to process your request right now.";
      }

      addMessage(responseText, 'response', currentInput, null, null);

    } catch (error) {
      console.error('Chatbot error:', error);
      addMessage(`❌ Sorry, something went wrong: ${error.message}`, 'response');
    } finally {
      setIsLoading(false);
    }
  };

  // All conversation flows and workflows are now handled by the Mastra agent
  // The agent intelligently detects intent and executes appropriate workflows:
  // - Loan application workflow
  // - Insurance claim workflow
  // - Yield prediction workflow
  // - Plant disease detection workflow
  // - General farming advice and queries

  const startListening = async () => {
    try {
      // Use Whisper API for better accuracy (especially for Hindi)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const audioChunks = [];
      
      setIsListening(true);
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Convert to base64 and send to Whisper API
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result;
            // For Hinglish, use Hindi language hint as Whisper handles mixed language well
            const whisperLang = (preferredLang === 'hi' || preferredLang === 'hinglish') ? 'hi' : 'en';
            const data = await transcribeAudio(base64Audio, 'audio/webm', whisperLang);
            
            if (data.success && data.text) {
              setInputValue(data.text);
            } else {
              console.warn('Whisper transcription failed, falling back to browser API');
              fallbackToWebSpeech();
            }
          } catch (error) {
            console.error('Whisper API error:', error);
            fallbackToWebSpeech();
          }
          setIsListening(false);
        };
      };
      
      // Record for 5 seconds max
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      fallbackToWebSpeech();
    }
  };
  
  // Fallback to browser's Web Speech API
  const fallbackToWebSpeech = () => {
    if ('webkitSpeechRecognition' in window) {
      const r = new window.webkitSpeechRecognition();
      // For Hinglish, use Hindi as it handles mixed language better
      r.lang = (preferredLang === 'hi' || preferredLang === 'hinglish') ? 'hi-IN' : 'en-US';
      r.onstart = () => setIsListening(true);
      r.onresult = (e) => { setInputValue(e.results[0][0].transcript); setIsListening(false); };
      r.onend = () => setIsListening(false);
      r.start();
    } else {
      alert('Speech recognition not supported in your browser');
      setIsListening(false);
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
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-black uppercase text-white/90 flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition-colors"
                  onClick={toggleLang}
                >
                  <Languages className="h-3 w-3" />
                  {langLabels[preferredLang]}
                </span>
                <span 
                  className={`text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors ${useTTS ? 'text-yellow-300' : 'text-white/50'}`}
                  onClick={() => { setUseTTS(!useTTS); if (isSpeaking) stopSpeaking(); }}
                  title={useTTS ? 'TTS On - Click to disable' : 'TTS Off - Click to enable'}
                >
                  <Volume2 className="h-3 w-3" />
                  {useTTS ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-yellow-500 text-white p-2 rounded border-2 border-black hover:bg-yellow-600 transition-colors animate-pulse"
                  title="Stop speaking"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={toggleChat}
                className="bg-red-600 text-white p-2 rounded border-2 border-black hover:bg-red-700 transition-colors"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-stone-50 to-stone-100">
            {chats.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="font-bold mb-2">
                  {preferredLang === 'hi' ? '👋 किसान साथी में आपका स्वागत है!' : 
                   preferredLang === 'en' ? '👋 Welcome to Kisaan Saathi!' : 
                   '👋 Kisaan Saathi mein aapka swagat hai!'}
                </p>
                <p className="text-sm">
                  {preferredLang === 'hi' ? 'मैं आपकी इन चीजों में मदद कर सकता हूं:' : 
                   preferredLang === 'en' ? 'I can help you with:' : 
                   'Main aapki in cheezon mein madad kar sakta hoon:'}
                </p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>🏦 {preferredLang === 'hi' ? 'लोन आवेदन' : preferredLang === 'en' ? 'Loan Applications' : 'Loan Applications'}</li>
                  <li>🛡️ {preferredLang === 'hi' ? 'बीमा दावे' : preferredLang === 'en' ? 'Insurance Claims' : 'Insurance Claims'}</li>
                  <li>🌤️ {preferredLang === 'hi' ? 'मौसम की जानकारी' : preferredLang === 'en' ? 'Weather Information' : 'Mausam ki Jaankari'}</li>
                  <li>🚑 {preferredLang === 'hi' ? 'फसल रोग निदान' : preferredLang === 'en' ? 'Plant Disease Diagnosis' : 'Fasal Rog Diagnosis'}</li>
                  <li>📋 {preferredLang === 'hi' ? 'सरकारी योजनाएं' : preferredLang === 'en' ? 'Government Schemes' : 'Sarkari Yojanaein'}</li>
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