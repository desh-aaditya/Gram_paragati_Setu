import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdTextFields, MdContrast, MdVolumeUp, MdLanguage, MdHome, MdDashboard, MdLocationOn, MdWork, MdAccountBalance, MdBarChart, MdPeople } from 'react-icons/md';
import './Header.css';

interface HeaderProps {
  user?: {
    username: string;
    role: string;
    fullName: string;
  } | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [contrast, setContrast] = useState<'normal' | 'high'>('normal');
  const [showAccessibility, setShowAccessibility] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('large-font', fontSize === 'large');
    return () => {
      document.body.classList.remove('large-font');
    };
  }, [fontSize]);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', contrast === 'high');
    return () => {
      document.body.classList.remove('high-contrast');
    };
  }, [contrast]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

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
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  return (
    <header className="gov-header">
      <div className="gov-header-top">
        <div className="gov-header-content">
          <div className="gov-logo-section">
            <img 
              src="/gov-india-emblem.png" 
              alt="Government of India" 
              className="gov-emblem"
              onError={(e) => {
                // Fallback if logo doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="gov-text">
              <div className="gov-text-main">{t('footer.government')}</div>
              <div className="gov-text-dept">{t('footer.department')}</div>
            </div>
          </div>
          <div className="gov-header-actions">
            {!user && (
              <>
                <Link to="/login?role=employee" className="gov-btn-link">
                  {t('header.employeeLogin')}
                </Link>
                <Link to="/login?role=officer" className="gov-btn-primary">
                  {t('header.officerLogin')}
                </Link>
              </>
            )}
            {user && (
              <div className="user-menu">
                <span className="user-name">{user.fullName}</span>
                <button onClick={onLogout} className="gov-btn-link">
                  {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <nav className="gov-nav">
        <div className="gov-nav-content">
          <Link to="/" className="nav-link">
            <MdHome /> {t('header.home')}
          </Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">
                <MdDashboard /> Dashboard
              </Link>
              <Link to="/villages" className="nav-link">
                <MdLocationOn /> {t('villages.title')}
              </Link>
              <Link to="/projects" className="nav-link">
                <MdWork /> {t('projects.title')}
              </Link>
              {user.role === 'officer' && (
                <>
                  <Link to="/funds" className="nav-link">
                    <MdAccountBalance /> {t('funds.title')}
                  </Link>
                  <Link to="/analytics" className="nav-link">
                    <MdBarChart /> {t('analytics.title')}
                  </Link>
                  <Link to="/employees" className="nav-link">
                    <MdPeople /> Employees
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        <div className="nav-right-actions">
          <div className="accessibility-menu">
            <button 
              className="accessibility-toggle"
              onClick={() => setShowAccessibility(!showAccessibility)}
              aria-label="Accessibility Options"
              title="Accessibility Options"
            >
              <MdTextFields /> <MdContrast /> <MdVolumeUp />
            </button>
            {showAccessibility && (
              <div className="accessibility-dropdown">
                <button
                  onClick={toggleFontSize}
                  className="accessibility-btn"
                  aria-label={fontSize === 'normal' ? 'Increase font size' : 'Decrease font size'}
                  title={fontSize === 'normal' ? 'Large Text' : 'Normal Text'}
                >
                  <MdTextFields /> {fontSize === 'normal' ? 'Large Text' : 'Normal Text'}
                </button>
                <button
                  onClick={toggleContrast}
                  className="accessibility-btn"
                  aria-label={contrast === 'normal' ? 'Enable high contrast' : 'Disable high contrast'}
                  title={contrast === 'normal' ? 'High Contrast' : 'Normal Contrast'}
                >
                  <MdContrast /> {contrast === 'normal' ? 'High Contrast' : 'Normal Contrast'}
                </button>
                <button
                  onClick={speakText}
                  className="accessibility-btn"
                  aria-label="Read aloud"
                  title="Screen Reader / Read Aloud"
                >
                  <MdVolumeUp /> Read Aloud
                </button>
              </div>
            )}
          </div>
          <div className="language-switcher">
            <button 
              onClick={() => changeLanguage('en')} 
              className={i18n.language === 'en' ? 'active' : ''}
              aria-label="Switch to English"
            >
              <MdLanguage /> EN
            </button>
            <button 
              onClick={() => changeLanguage('hi')} 
              className={i18n.language === 'hi' ? 'active' : ''}
              aria-label="Switch to Hindi"
            >
              <MdLanguage /> हिं
            </button>
            <button 
              onClick={() => changeLanguage('ta')} 
              className={i18n.language === 'ta' ? 'active' : ''}
              aria-label="Switch to Tamil"
            >
              <MdLanguage /> த
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
