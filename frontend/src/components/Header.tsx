import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
                <Link to="/login" className="gov-btn-link">
                  {t('header.volunteerLogin')}
                </Link>
                <Link to="/login?role=employee" className="gov-btn-primary">
                  {t('header.employeeLogin')}
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
          <Link to="/" className="nav-link">{t('header.home')}</Link>
          {user && (
            <>
              {user.role === 'officer' && (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/villages" className="nav-link">{t('villages.title')}</Link>
                  <Link to="/projects" className="nav-link">{t('projects.title')}</Link>
                  <Link to="/funds" className="nav-link">{t('funds.title')}</Link>
                  <Link to="/analytics" className="nav-link">{t('analytics.title')}</Link>
                  <Link to="/employees" className="nav-link">Employees</Link>
                </>
              )}
              {user.role === 'employee' && (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/villages" className="nav-link">{t('villages.title')}</Link>
                  <Link to="/projects" className="nav-link">{t('projects.title')}</Link>
                </>
              )}
            </>
          )}
        </div>
        <div className="language-switcher">
          <button 
            onClick={() => changeLanguage('en')} 
            className={i18n.language === 'en' ? 'active' : ''}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button 
            onClick={() => changeLanguage('hi')} 
            className={i18n.language === 'hi' ? 'active' : ''}
            aria-label="Switch to Hindi"
          >
            हिं
          </button>
          <button 
            onClick={() => changeLanguage('ta')} 
            className={i18n.language === 'ta' ? 'active' : ''}
            aria-label="Switch to Tamil"
          >
            த
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
