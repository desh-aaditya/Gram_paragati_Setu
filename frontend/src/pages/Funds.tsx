import React from 'react';
import { useTranslation } from 'react-i18next';
import './Funds.css';

const Funds: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="funds-page">
      <h1>{t('funds.title')}</h1>
      <p>Fund management interface - Coming soon</p>
    </div>
  );
};

export default Funds;
