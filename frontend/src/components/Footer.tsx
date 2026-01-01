import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="gov-footer">
      <div className="gov-footer-content">
        <div className="gov-footer-section">
          <h3>{t('footer.department')}</h3>
          <p>{t('footer.government')}</p>
        </div>
        <div className="gov-footer-section">
          <h3>{t('footer.contact')}</h3>
          <p>{t('footer.email')}: contact@pmajay.gov.in</p>
          <p>{t('footer.phone')}: 1800-XXX-XXXX</p>
        </div>
        <div className="gov-footer-section">
          <h3>{t('footer.links')}</h3>
          <ul>
            <li><a href="https://socialjustice.gov.in" target="_blank" rel="noopener noreferrer">{t('footer.ministryWebsite')}</a></li>
            <li><a href="/about">{t('footer.about')}</a></li>
            <li><a href="/help">{t('footer.help')}</a></li>
          </ul>
        </div>
      </div>
      <div className="gov-footer-bottom">
        <p>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;
