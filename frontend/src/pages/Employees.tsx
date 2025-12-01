import React from 'react';
import { useTranslation } from 'react-i18next';
import './Employees.css';

const Employees: React.FC = () => {
  useTranslation(); // Keep for i18n context

  return (
    <div className="employees-page">
      <h1>Employee Management</h1>
      <p>Employee management interface - Coming soon</p>
    </div>
  );
};

export default Employees;
