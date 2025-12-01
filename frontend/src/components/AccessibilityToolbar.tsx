import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AccessibilityToolbar.css';

const AccessibilityToolbar: React.FC = () => {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [contrast, setContrast] = useState<'normal' | 'high'>('normal');

  useEffect(() => {
    // Apply font size
    document.body.classList.toggle('large-font', fontSize === 'large');
    return () => {
      document.body.classList.remove('large-font');
    };
  }, [fontSize]);

  useEffect(() => {
    // Apply contrast
    document.body.classList.toggle('high-contrast', contrast === 'high');
    return () => {
      document.body.classList.remove('high-contrast');
    };
  }, [contrast]);

  const toggleFontSize = () => {
    setFontSize(prev => prev === 'normal' ? 'large' : 'normal');
  };

  const toggleContrast = () => {
    setContrast(prev => prev === 'normal' ? 'high' : 'normal');
  };

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        document.body.innerText.substring(0, 500)
      );
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  return (
    <div className="accessibility-toolbar" role="toolbar" aria-label="Accessibility Options">
      <button
        onClick={toggleFontSize}
        className="toolbar-btn"
        aria-label={fontSize === 'normal' ? 'Increase font size' : 'Decrease font size'}
        title={fontSize === 'normal' ? 'Large Text' : 'Normal Text'}
      >
        <span className="toolbar-icon">A</span>
        <span className="toolbar-icon-large">A</span>
      </button>
      <button
        onClick={toggleContrast}
        className="toolbar-btn"
        aria-label={contrast === 'normal' ? 'Enable high contrast' : 'Disable high contrast'}
        title={contrast === 'normal' ? 'High Contrast' : 'Normal Contrast'}
      >
        <span className="toolbar-icon">◐</span>
      </button>
      <button
        onClick={speakText}
        className="toolbar-btn"
        aria-label="Read aloud"
        title="Screen Reader / Read Aloud"
      >
        <span className="toolbar-icon">🔊</span>
      </button>
    </div>
  );
};

export default AccessibilityToolbar;
