import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  MdAccountBalance, 
  MdTrendingUp, 
  MdBarChart, 
  MdMap, 
  MdCheckCircle,
  MdLogin,
  MdPeople,
  MdHome
} from 'react-icons/md';
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
            <Link to="/login?role=employee" className="home-btn-secondary">
              <MdLogin /> {t('header.employeeLogin')}
            </Link>
            <Link to="/login?role=officer" className="home-btn-primary">
              <MdPeople /> {t('header.officerLogin')}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="home-container">
          <h2>{t('home.features.title')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <MdAccountBalance />
              </div>
              <h3>{t('home.features.fundManagement')}</h3>
              <p>{t('home.features.fundManagementDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <MdTrendingUp />
              </div>
              <h3>{t('home.features.villageTracking')}</h3>
              <p>{t('home.features.villageTrackingDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <MdBarChart />
              </div>
              <h3>{t('home.features.analytics')}</h3>
              <p>{t('home.features.analyticsDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <MdMap />
              </div>
              <h3>{t('home.features.gisMapping')}</h3>
              <p>{t('home.features.gisMappingDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <MdCheckCircle />
              </div>
              <h3>{t('home.features.projectMonitoring')}</h3>
              <p>{t('home.features.projectMonitoringDesc')}</p>
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
