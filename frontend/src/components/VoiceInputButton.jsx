import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import cn from '../utils/cn';

export default function VoiceInputButton({ onTranscript, className, size = 18, placeholderHint = '' }) {
  const { lang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  const speechLang = lang === 'gu' ? 'gu-IN' : 'en-IN';

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript && onTranscript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMessage(lang === 'gu' ? 'માઇક્રોફોન પરમિશન નથી' : 'Microphone permission denied');
      } else if (event.error !== 'no-speech') {
        setErrorMessage(lang === 'gu' ? 'વોઇસ ઓળખવામાં ક્ષતિ' : 'Speech recognition error');
      }
      setTimeout(() => setErrorMessage(''), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [speechLang, onTranscript, lang]);

  if (!supported) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    } else {
      try {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const isGu = lang === 'gu';
  const label = isListening
    ? (isGu ? 'સાંભળે છે... બોલો' : 'Listening... Speak now')
    : (isGu ? 'બોલીને લખો (ગુજરાતી)' : 'Speak to input');

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={label}
        aria-label={label}
        className={cn(
          'relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center',
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 ring-4 ring-rose-500/20'
            : 'bg-surface hover:bg-slate-100 text-muted hover:text-ink border border-line',
          className
        )}
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <Mic size={size} className="animate-pulse" />
          </>
        ) : (
          <Mic size={size} />
        )}
      </button>

      {isListening && (
        <span className="absolute left-full ml-2 whitespace-nowrap text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md shadow-sm z-10 animate-fade-in">
          {label}
        </span>
      )}

      {errorMessage && (
        <span className="absolute left-full ml-2 whitespace-nowrap text-xs text-danger bg-danger/10 border border-danger/20 px-2 py-1 rounded-md shadow-sm z-10">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
