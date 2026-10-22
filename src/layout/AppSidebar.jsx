/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import { useEffect, useState } from 'react';
import {
  faAward,
  faBookOpen,
  faBookReader,
  faBuilding,
  faChartLine,
  faChevronDown,
  faCog,
  faCompass,
  faClipboardList,
  faFileAlt,
  faFlag,
  faGlobe,
  faGraduationCap,
  faIdCard,
  faInbox,
  faLandmark,
  faShieldAlt,
  faUserFriends,
  faUserCircle,
  faWaveSquare,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink, useLocation } from 'react-router-dom';
import { useUserRole } from '../contexts/UserRoleContext';
import { ADMIN_PATHS } from '../utils/adminPaths';
import { HEADER_LOGO_FALLBACK, resolveHeaderLogoSrc } from '../utils/brandAssets';
import { getNavigationItemsByRole } from './navigation';
import layoutMessages from './messages';

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const AppSidebar = ({
  collapsed,
  isMobile,
  mobileOpen,
  onNavigate,
}) => {
  const { formatMessage } = useIntl();
  const location = useLocation();
  const { role, navbarAccess } = useUserRole();
  const isReportsActive = location.pathname.startsWith('/admin/reports');
  const [reportsOpen, setReportsOpen] = useState(isReportsActive);

  const iconMap = {
    dashboard: faChartLine,
    competencyFramework: faAward,
    activities: faWaveSquare,
    exploreTraining: faCompass,
    trainingCatalog: faBookOpen,
    myTrainingCatalog: faGraduationCap,
    nraSpecificTrainingCatalog: faLandmark,
    myTraining: faBookReader,
    nras: faGlobe,
    countries: faFlag,
    trainingProviders: faBuilding,
    pendingRequests: faInbox,
    requestedTrainings: faClipboardList,
    profile: faUserCircle,
    users: faUsers,
    myTeam: faUserFriends,
    regulatoryPassport: faIdCard,
    organizationProfile: faLandmark,
    roles: faShieldAlt,
    reports: faFileAlt,
    settings: faCog,
  };

  useEffect(() => {
    if (isReportsActive) {
      setReportsOpen(true);
    }
  }, [isReportsActive]);

  const visibleNavigationItems = getNavigationItemsByRole(role, navbarAccess);

  return (
    <aside className={`admin-sidebar ${collapsed ? 'is-collapsed' : ''} ${isMobile ? 'is-mobile' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <div className="admin-sidebar__top">
        <div className="admin-sidebar__brand">
          {!collapsed && (
            <img
              className="admin-sidebar__brand-img"
              src={resolveHeaderLogoSrc()}
              alt={formatMessage(layoutMessages.sidebarBrandAlt)}
              onError={({ currentTarget }) => {
                const image = currentTarget;
                image.onerror = null;
                image.src = HEADER_LOGO_FALLBACK;
              }}
            />
          )}
        </div>
      </div>

      <div className="admin-sidebar__nav-group">
        <div className="admin-sidebar__section-label">
          {!collapsed && formatMessage(layoutMessages.sidebarSectionManagement)}
        </div>

        <nav className="admin-sidebar__nav" aria-label={formatMessage(layoutMessages.sidebarSectionManagement)}>
          {visibleNavigationItems.map((item) => {
            const isParentActive = item.children
              ? item.children.some(child => location.pathname.startsWith(child.path))
              : location.pathname.startsWith(item.path);
            let navPath = item.path;
            if (item.key === 'dashboard' && role) {
              navPath = ADMIN_PATHS.dashboardRole(role);
            }

            return (
              <div
                key={item.key}
                className={`admin-sidebar__item-group${item.key === 'reports' ? ' is-ui-hidden' : ''}`}
              >
                {!item.children && (
                  <NavLink
                    to={navPath}
                    className={({ isActive }) => {
                      const nestedActive = item.key === 'uploadTrainingWithAi'
                        && location.pathname.startsWith('/admin/upload-training-with-ai');
                      return `admin-sidebar__item ${isActive || nestedActive ? 'is-active' : ''}`;
                    }}
                    onClick={onNavigate}
                  >
                    <span className="admin-sidebar__item-icon">
                      {item.iconKey === 'uploadTrainingWithAi' ? (
                        <SparklesIcon />
                      ) : (
                        <FontAwesomeIcon icon={iconMap[item.iconKey]} />
                      )}
                    </span>
                    {!collapsed && <span>{formatMessage(layoutMessages[item.labelKey])}</span>}
                  </NavLink>
                )}

                {item.children && (
                  <>
                    <button
                      type="button"
                      className={`admin-sidebar__item admin-sidebar__item-toggle is-parent ${isParentActive ? 'is-active' : ''}`}
                      onClick={() => setReportsOpen(prev => !prev)}
                    >
                      <span className="admin-sidebar__item-icon">
                        <FontAwesomeIcon icon={iconMap[item.iconKey]} />
                      </span>
                      {!collapsed && (
                        <>
                          <span className="admin-sidebar__item-text">
                            {formatMessage(layoutMessages[item.labelKey])}
                          </span>
                          <span className={`admin-sidebar__chevron ${reportsOpen ? 'is-open' : ''}`}>
                            <FontAwesomeIcon icon={faChevronDown} />
                          </span>
                        </>
                      )}
                    </button>
                    {!collapsed && reportsOpen && (
                      <div className="admin-sidebar__subnav is-open">
                        {item.children.map(child => (
                          <NavLink
                            key={child.key}
                            to={child.path}
                            className={({ isActive }) => `admin-sidebar__subitem ${isActive ? 'is-active' : ''}`}
                            onClick={onNavigate}
                          >
                            <span className="admin-sidebar__subitem-icon">
                              <FontAwesomeIcon icon={faFileAlt} />
                            </span>
                            {formatMessage(layoutMessages[child.labelKey])}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
