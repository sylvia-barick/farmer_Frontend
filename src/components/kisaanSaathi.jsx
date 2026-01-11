import React, { useState, useRef } from 'react';
import { ArrowLeft, Send, Mic, MessageCircle, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { askAI, sendFeedback } from '../services/backendApi';

const KisaanSaathi = ({ onBack }) => {
  const [chats, setChats] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);

  const speakText = (text, lang = 'hi-IN') => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech Synthesis not supported or text is empty.');
      return;
    }

    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // bold removal

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === lang);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakNow();
      };
    } else {
      speakNow();
    }
  };

  const getresponse = async (inputValue) => {
    const query_text = await translateHindiToEnglish(inputValue);
    const answer = await askAI(query_text);
    return answer;
  }

  const handleFeedback = async (originalQuery, rating) => {
    console.log(`Sending feedback for: "${originalQuery}" - Rating: ${rating}`);
    await sendFeedback(originalQuery, rating);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const newQuery = {
        query: inputValue,
        type: 'query'
      };

      setChats(prev => [...prev, newQuery]);
      setIsLoading(true);

      // Store current input as original query for feedback before clearing
      const currentInput = inputValue;

      try {
        const aiResponseText = await getresponse(currentInput);

        const response = {
          query: await translateEnglishToHindi(aiResponseText),
          type: 'response',
          originalQuery: currentInput
        };
        setChats(prev => [...prev, response]);
        speakText(response.query);
      } catch (error) {
        console.error('Error getting response:', error);
        const errorResponse = {
          query: 'माफ़ करें, कुछ गलत हो गया। कृपया फिर से कोशिश करें।',
          type: 'response'
        };
        setChats(prev => [...prev, errorResponse]);
        speakText(errorResponse.query);
      } finally {
        setIsLoading(false);
        setInputValue('');
      }
    }
  };

  const translateHindiToEnglish = async (text) => {
    if (!text) return '';
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      return data[0]?.map((part) => part[0]).join('') || '';
    } catch (err) {
      console.error('Translation failed:', err);
      return text;
    }
  };

  const translateEnglishToHindi = async (text) => {
    if (!text) return '';
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      return data[0]?.map((part) => part[0]).join('') || '';
    } catch (err) {
      console.error('Translation failed:', err);
      return text;
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in this browser');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="min-h-screen bg-agricultural-soft-sand p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="mb-4 text-agricultural-soil-brown hover:bg-agricultural-stone-gray/10 px-4 py-2 rounded-md inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <MessageCircle className="h-8 w-8 text-agricultural-forest-green" />
          <h1 className="text-3xl font-bold text-agricultural-soil-brown">Kisaan Saathi</h1>
        </div>
        <p className="text-agricultural-stone-gray">
          Your AI farming assistant - Ask questions about crops, weather, loans, and more
        </p>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-agricultural-stone-gray/20 h-[600px] flex flex-col warm-shadow">
          <div className="p-6 border-b border-agricultural-stone-gray/20">
            <h2 className="text-xl font-semibold text-agricultural-soil-brown text-center">
              Chat with Kisaan Saathi
            </h2>
          </div>

          <div className="flex-1 flex flex-col p-6">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
              {chats.length === 0 ? (
                <div className="text-center text-agricultural-stone-gray py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-agricultural-forest-green" />
                  <p className="text-lg">Welcome to Kisaan Saathi!</p>
                  <p className="text-sm">Ask me anything about farming, loans, insurance, or weather.</p>
                </div>
              ) : (
                <>
                  {chats.map((chat, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${chat.type === 'query' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${chat.type === 'query'
                          ? 'bg-agricultural-forest-green text-white'
                          : 'bg-white border border-agricultural-stone-gray/20 text-agricultural-soil-brown'
                          }`}
                      >
                        <p className="text-sm">{chat.query}</p>
                      </div>

                      {/* Feedback Buttons */}
                      {chat.type === 'response' && (
                        <div className="flex items-center space-x-2 mt-1 ml-1">
                          <button
                            onClick={() => handleFeedback(chat.originalQuery, 5)}
                            className="p-1 hover:bg-green-100 rounded-full text-gray-500 hover:text-green-600 transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(chat.originalQuery, 1)}
                            className="p-1 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                            title="Not Helpful"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] p-3 rounded-lg bg-white border border-agricultural-stone-gray/20 text-agricultural-soil-brown">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-agricultural-forest-green" />
                          <p className="text-sm text-agricultural-stone-gray">Kisaan Saathi सोच रहा है...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-agricultural-stone-gray/20 pt-4 mt-auto">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your farming question here..."
                  className="flex-1 px-3 py-2 border border-agricultural-stone-gray/30 rounded-md focus:outline-none focus:ring-2 focus:ring-agricultural-forest-green focus:border-transparent"
                  disabled={isListening}
                />

                <button
                  onClick={startListening}
                  disabled={isListening}
                  className={`flex-shrink-0 w-10 h-10 rounded-md inline-flex items-center justify-center border ${isListening ? 'bg-agricultural-forest-green text-white' : 'border-agricultural-forest-green text-agricultural-forest-green hover:bg-agricultural-forest-green hover:text-white'
                    }`}
                >
                  <Mic className="h-4 w-4" />
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isListening || isLoading}
                  className="bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white px-4 py-2 rounded-md inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isListening && (
                <p className="text-sm text-agricultural-forest-green mt-2 text-center">
                  Listening... Speak now
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KisaanSaathi;