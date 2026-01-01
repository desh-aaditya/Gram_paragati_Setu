import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    MdDashboard,
    MdLandscape,
    MdWork,
    MdPeople,
    MdEditDocument,
    MdBarChart,
    MdAdminPanelSettings,
    MdChevronLeft,
    MdChevronRight
} from 'react-icons/md';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, userRole }) => {
    const { t } = useTranslation();

    return (
        <aside className={`gov-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-toggle" onClick={toggleSidebar}>
                {isOpen ? <MdChevronLeft /> : <MdChevronRight />}
            </div>

            <nav className="sidebar-nav">
                {/* Common Links */}
                <div className="nav-group">
                    <p className="group-label">{t('header.menu')}</p>
                    <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <MdDashboard className="icon" />
                        <span className="label">{t('header.dashboard')}</span>
                    </NavLink>
                    <NavLink to="/villages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <MdLandscape className="icon" />
                        <span className="label">{t('header.villages')}</span>
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <MdWork className="icon" />
                        <span className="label">{t('header.projects')}</span>
                    </NavLink>
                </div>

                {/* Employee Specific */}
                {userRole === 'employee' && (
                    <div className="nav-group">
                        <p className="group-label">Field Work</p>
                        <NavLink to="/volunteers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <MdPeople className="icon" />
                            <span className="label">{t('header.volunteers')}</span>
                        </NavLink>
                        <NavLink to="/village-plan-update" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <MdEditDocument className="icon" />
                            <span className="label">{t('header.villagePlanUpdate')}</span>
                        </NavLink>
                    </div>
                )}

                {/* Officer Specific */}
                {userRole === 'officer' && (
                    <div className="nav-group">
                        <p className="group-label">Administration</p>
                        <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <MdBarChart className="icon" />
                            <span className="label">{t('analytics.title')}</span>
                        </NavLink>
                        <NavLink to="/manage" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <MdAdminPanelSettings className="icon" />
                            <span className="label">{t('header.manage')}</span>
                        </NavLink>
                        <NavLink to="/employees" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <MdPeople className="icon" />
                            <span className="label">{t('header.employees')}</span>
                        </NavLink>
                        <NavLink to="/village-plan-update" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <MdEditDocument className="icon" />
                            <span className="label">{t('header.villagePlanUpdate')}</span>
                        </NavLink>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="footer-pattern"></div>
            </div>
        </aside>
    );
};

export default Sidebar;
