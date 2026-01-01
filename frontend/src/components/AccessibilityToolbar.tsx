import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AccessibilityToolbar.css';

const AccessibilityToolbar: React.FC = () => {
  const { i18n } = useTranslation();

  // Initialize state from localStorage or defaults
  const [fontSize, setFontSize] = useState<'normal' | 'large'>(() => {
    return (localStorage.getItem('accessibility_fontSize') as 'normal' | 'large') || 'normal';
  });

  const [contrast, setContrast] = useState<'normal' | 'high'>(() => {
    return (localStorage.getItem('accessibility_contrast') as 'normal' | 'high') || 'normal';
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Persist font size and apply class
  useEffect(() => {
    localStorage.setItem('accessibility_fontSize', fontSize);
    if (fontSize === 'large') {
      document.body.classList.add('large-font');
    } else {
      document.body.classList.remove('large-font');
    }
  }, [fontSize]);

  // Persist contrast and apply class
  useEffect(() => {
    localStorage.setItem('accessibility_contrast', contrast);
    if (contrast === 'high') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [contrast]);

  // Handle language change
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const toggleFontSize = () => {
    setFontSize(prev => prev === 'normal' ? 'large' : 'normal');
  };

  const toggleContrast = () => {
    setContrast(prev => prev === 'normal' ? 'high' : 'normal');
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Stop any current speech first
      window.speechSynthesis.cancel();

      const textToRead = document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(textToRead);

      // Set language based on current i18n language
      // Map i18n codes to speech synthesis codes if necessary
      const langMap: Record<string, string> = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'ta': 'ta-IN'
      };
      utterance.lang = langMap[i18n.language] || 'en-IN';

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="accessibility-toolbar" role="toolbar" aria-label="Accessibility Options">
      <div className="toolbar-group">
        <select
          className="lang-selector"
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          aria-label="Select Language"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
          <option value="ta">தமிழ் (Tamil)</option>
        </select>
      </div>

      <button
        onClick={toggleFontSize}
        className={`toolbar-btn ${fontSize === 'large' ? 'active' : ''}`}
        aria-label={fontSize === 'normal' ? 'Increase font size' : 'Reset font size'}
        aria-pressed={fontSize === 'large'}
        title="Toggle Text Size"
      >
        <span className="toolbar-icon" style={{ fontSize: '1.2rem' }}>A</span>
        <span className="toolbar-icon-large" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>A</span>
      </button>

      <button
        onClick={toggleContrast}
        className={`toolbar-btn ${contrast === 'high' ? 'active' : ''}`}
        aria-label={contrast === 'normal' ? 'Enable high contrast' : 'Disable high contrast'}
        aria-pressed={contrast === 'high'}
        title="Toggle High Contrast"
      >
        <span className="toolbar-icon">◐</span>
      </button>

      <button
        onClick={toggleSpeech}
        className={`toolbar-btn ${isSpeaking ? 'active speaking' : ''}`}
        aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
        aria-pressed={isSpeaking}
        title="Read Aloud"
      >
        <span className="toolbar-icon">{isSpeaking ? '⏹' : '🔊'}</span>
      </button>
    </div>
  );
};

export default AccessibilityToolbar;
