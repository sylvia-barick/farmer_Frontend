import React, { useEffect, useState, useRef } from 'react';
import { Globe } from "lucide-react";

const SimpleGoogleTranslate = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Add Google Translate script dynamically if not present
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);

      window.googleTranslateElementInit = function () {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,bn,ta,te,ml,kn,mr,gu,pa,or,as,ne,sd,ur',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true
        }, 'google_translate_element');
      };
    }

    // Click outside listener
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (languageCode) => {
    console.log('Changing language to:', languageCode);

    // Method 1: standard Google Translate select interaction
    const translateSelect = document.querySelector('.goog-te-combo');
    if (translateSelect) {
      translateSelect.value = languageCode;
      translateSelect.dispatchEvent(new Event('change'));
      setCurrentLanguage(languageCode);
      setIsOpen(false);
    } else {
      // Method 2: Fallback to cookie + reload
      console.log('Translation select not found, using fallback.');
      const exdate = new Date();
      exdate.setDate(exdate.getDate() + 30);
      const cookieValue = escape(languageCode);
      document.cookie = "googtrans=/en/" + languageCode + "; expires=" + exdate.toUTCString();
      window.location.reload();
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'অসমীয়া' },
    { code: 'ne', name: 'नेपाली' },
    { code: 'sd', name: 'سنڌي' },
    { code: 'ur', name: 'اردو' }
  ];

  return (
    <div className="relative z-50 pt-1" ref={dropdownRef}>
      {/* Hidden Original Element */}
      <div
        id="google_translate_element"
        className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
      ></div>

      {/* Custom UI */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white text-gray-900 
          rounded-lg px-4 py-2.5 font-bold flex items-center gap-2 
          border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all duration-200"
        >
          <Globe className="h-5 w-5" />
          <span className="hidden sm:inline text-sm uppercase tracking-wider">
            {languages.find(lang => lang.code === currentLanguage)?.name || 'Translate'}
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[101] max-h-[300px] overflow-y-auto"
          >
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-3 font-medium hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0 ${currentLanguage === language.code ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleGoogleTranslate;