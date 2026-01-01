import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { MdTextFields, MdContrast, MdVolumeUp, MdLanguage, MdDashboard, MdBarChart, MdPeople, MdLandscape, MdWork, MdAdminPanelSettings, MdHome, MdClose, MdEditDocument, MdColorLens } from 'react-icons/md';
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
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [contrast, setContrast] = useState<'normal' | 'high'>('normal');
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

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
      utterance.lang = i18n.language === 'hi' ? 'hi-IN' :
        i18n.language === 'kn' ? 'kn-IN' :
          i18n.language === 'mr' ? 'mr-IN' :
            i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && showProfileModal) {
      setProfileData({
        full_name: user.fullName || '',
        username: user.username || '',
        password: '',
        confirmPassword: ''
      });
      setProfileError('');
      setProfileSuccess('');
    }
  }, [user, showProfileModal]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      setProfileError('Passwords do not match');
      return;
    }

    try {
      setIsUpdating(true);
      // Dynamic import to avoid circular dependency if api uses Header (unlikely but safe)
      // or just use fetch if api is not available here. 
      // Assuming api is available or we can import it.
      // Since api is not imported, let's import it at top or use fetch.
      // Let's assume we need to add import api from '../utils/api'; at top.
      // For now, I'll use fetch with the token from localStorage if possible, 
      // but better to use the api utility if I can add the import.
      // I will add the import in a separate edit or assume it's there? 
      // No, I should add it.
      // Wait, I can't add import here easily without changing top of file.
      // I'll use the existing 'api' utility by adding the import in a separate step or 
      // I'll use a dynamic import here if supported, or just fetch.
      // Let's try to use the api utility by adding the import first.
      // Actually, I'll just use fetch for now to be safe and self-contained, 
      // or better, I'll add the import in a previous step? No, I'm in the middle of this.
      // I will use a direct fetch with the token.

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          username: profileData.username,
          password: profileData.password || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileSuccess('Profile updated successfully! Please login again to see changes.');
      setTimeout(() => {
        setShowProfileModal(false);
        if (onLogout) onLogout(); // Force logout to refresh token/user data
      }, 2000);

    } catch (error: any) {
      setProfileError(error.message || 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="gov-header">
      <div className="gov-header-top">
        <div className="gov-header-content">
          <Link to="/" className="gov-logo-section" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img
              src="/gov-india-emblem.jpg"
              alt="Government of India"
              className="gov-emblem"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="gov-text">
              <div className="gov-text-main">{t('footer.government')}</div>
              <div className="gov-text-dept">{t('footer.department')}</div>
            </div>
          </Link>
          <div className="gov-header-actions">
            {!user && (
              <div className="login-menu" style={{ position: 'relative' }}>
                <button
                  className="gov-btn-primary"
                  onClick={() => setShowLoginMenu(!showLoginMenu)}
                >
                  {t('header.login')}
                </button>
                {showLoginMenu && (
                  <div className="accessibility-dropdown" style={{ right: 0, minWidth: '180px' }}>
                    <Link to="/login?role=employee" className="accessibility-btn" onClick={() => setShowLoginMenu(false)}>
                      <MdPeople /> {t('header.employeeLogin')}
                    </Link>
                    <Link to="/login?role=officer" className="accessibility-btn" onClick={() => setShowLoginMenu(false)}>
                      <MdAdminPanelSettings /> {t('header.officerLogin')}
                    </Link>
                  </div>
                )}
              </div>
            )}
            {user && (
              <div className="user-menu" style={{ position: 'relative' }}>
                <button
                  className="user-name-btn"
                  onClick={() => setShowLoginMenu(!showLoginMenu)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
                >
                  <span className="user-name">{user.fullName}</span>
                  <MdAdminPanelSettings />
                </button>

                {showLoginMenu && (
                  <div className="accessibility-dropdown" style={{ right: 0, minWidth: '150px', top: '100%' }}>
                    <button
                      className="accessibility-btn"
                      onClick={() => { setShowProfileModal(true); setShowLoginMenu(false); }}
                    >
                      <MdPeople /> {t('profile.title')}
                    </button>
                    <button onClick={onLogout} className="accessibility-btn">
                      <MdClose /> {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Language Selector in Main Toolbar */}
            <div className="language-selector-main" style={{ marginRight: '1rem', display: 'flex', alignItems: 'center' }}>
              <MdLanguage style={{ marginRight: '4px', fontSize: '1.2rem' }} />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  background: 'white',
                  color: '#333',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                aria-label="Select Language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="ta">தமிழ்</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="mr">मराठी</option>
                <option value="bho">भोजपुरी</option>
                <option value="haryanvi">हरियाणवी</option>
              </select>
            </div>

            <div className="accessibility-menu">
              <button
                className="accessibility-toggle"
                onClick={() => setShowAccessibility(!showAccessibility)}
                aria-label="Accessibility Options"
                title="Accessibility Options"
              >
                <MdTextFields /> <MdContrast /> <MdColorLens />
              </button>
              {showAccessibility && (
                <div className="accessibility-dropdown">
                  <div className="accessibility-section">
                    <span className="section-label">{t('accessibility.theme') || 'Theme'}</span>
                    <div className="theme-options">
                      <button onClick={() => setTheme('default')} className={`theme-btn default ${theme === 'default' ? 'active' : ''}`} title="Blue (Default)" />
                      <button onClick={() => setTheme('saffron')} className={`theme-btn saffron ${theme === 'saffron' ? 'active' : ''}`} title="Saffron" />
                      <button onClick={() => setTheme('green')} className={`theme-btn green ${theme === 'green' ? 'active' : ''}`} title="Green" />
                      <button onClick={() => setTheme('teal')} className={`theme-btn teal ${theme === 'teal' ? 'active' : ''}`} title="Teal" />
                    </div>
                  </div>
                  <div className="divider"></div>
                  <button
                    onClick={toggleFontSize}

                    className="accessibility-btn"
                    aria-label={fontSize === 'normal' ? 'Increase font size' : 'Decrease font size'}
                    title={fontSize === 'normal' ? t('accessibility.largeText') : t('accessibility.normalText')}
                  >
                    <MdTextFields /> {fontSize === 'normal' ? t('accessibility.largeText') : t('accessibility.normalText')}
                  </button>
                  <button
                    onClick={toggleContrast}
                    className="accessibility-btn"
                    aria-label={contrast === 'normal' ? 'Enable high contrast' : 'Disable high contrast'}
                    title={contrast === 'normal' ? t('accessibility.highContrast') : t('accessibility.normalContrast')}
                  >
                    <MdContrast /> {contrast === 'normal' ? t('accessibility.highContrast') : t('accessibility.normalContrast')}
                  </button>
                  <button
                    onClick={speakText}
                    className="accessibility-btn"
                    aria-label="Read aloud"
                    title={t('accessibility.readAloud')}
                  >
                    <MdVolumeUp /> {t('accessibility.readAloud')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {
        showProfileModal && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2>{t('profile.title')}</h2>
                <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                  <MdClose />
                </button>
              </div>
              <form onSubmit={handleProfileUpdate} className="project-form">
                {profileError && <div className="error-message">{profileError}</div>}
                {profileSuccess && <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>{profileSuccess}</div>}

                <div className="form-group">
                  <label>{t('profile.fullName')}</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('auth.username')}</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('profile.newPassword')}</label>
                  <input
                    type="password"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn-primary" disabled={isUpdating}>
                    {isUpdating ? t('profile.updating') : t('profile.update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      <nav className="gov-nav">
        <div className="gov-nav-content">
          <div className="nav-links">
            {!user && (
              <Link to="/" className="nav-link">
                <MdHome /> {t('header.home')}
              </Link>
            )}
            {user && (
              <>
                <Link to="/dashboard" className="nav-link">
                  <MdDashboard /> {t('header.dashboard')}
                </Link>
                <Link to="/villages" className="nav-link">
                  <MdLandscape /> {t('header.villages')}
                </Link>
                <Link to="/projects" className="nav-link">
                  <MdWork /> {t('header.projects')}
                </Link>
                {user.role === 'employee' && (
                  <>
                    <Link to="/volunteers" className="nav-link">
                      <MdPeople /> {t('header.volunteers')}
                    </Link>
                    <Link to="/village-plan-update" className="nav-link">
                      <MdEditDocument /> {t('header.villagePlanUpdate')}
                    </Link>
                  </>
                )}
                {user.role === 'officer' && (
                  <>
                    <Link to="/analytics" className="nav-link">
                      <MdBarChart /> {t('analytics.title')}
                    </Link>
                    <Link to="/manage" className="nav-link">
                      <MdAdminPanelSettings /> {t('header.manage')}
                    </Link>
                    <Link to="/employees" className="nav-link">
                      <MdPeople /> {t('header.employees')}
                    </Link>
                    <Link to="/village-plan-update" className="nav-link">
                      <MdEditDocument /> {t('header.villagePlanUpdate')}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </nav>
    </header >
  );
};

export default Header;
