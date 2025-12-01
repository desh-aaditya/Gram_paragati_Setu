import React from 'react';
import { useTranslation } from 'react-i18next';
import './Analytics.css';

const Analytics: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="analytics-page">
      <h1>{t('analytics.title')}</h1>
      <p>Analytics dashboard with charts and GIS map - Coming soon</p>
    </div>
  );
};

export default Analytics;
