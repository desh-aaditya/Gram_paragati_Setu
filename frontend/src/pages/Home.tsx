import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>{t('home.title')}</h1>
          <p className="home-subtitle">{t('home.welcome')}</p>
          <p className="home-description">{t('home.description')}</p>
          <div className="home-cta">
            <Link to="/login?role=employee" className="home-btn-primary">
              {t('home.loginCta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="home-container">
          <h2>{t('home.features.title')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>{t('home.features.fundManagement')}</h3>
              <p>Track and manage fund allocations and releases</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t('home.features.villageTracking')}</h3>
              <p>Monitor village progress and Adarsh scores</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>{t('home.features.analytics')}</h3>
              <p>Comprehensive analytics and reporting</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>{t('home.features.gisMapping')}</h3>
              <p>Interactive GIS maps for village visualization</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>{t('home.features.projectMonitoring')}</h3>
              <p>Real-time project and checkpoint monitoring</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-about">
        <div className="home-container">
          <h2>{t('home.aboutPmAjay.title')}</h2>
          <p>{t('home.aboutPmAjay.description')}</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
