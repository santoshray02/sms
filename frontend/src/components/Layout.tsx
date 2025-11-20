import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMenuItemsForUser } from '../config/menu';
import { APP_CONFIG } from '../config/app';
import { LogoutIcon, ChevronDownIcon, MenuIcon, XIcon } from './Icons';
import { COLORS, ELEVATION, TRANSITIONS } from '../config/design-system';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get menu items based on user role
  const navigation = getMenuItemsForUser(user?.role);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav
        className="bg-white sticky top-0 z-50"
        style={{ boxShadow: ELEVATION.md }}
      >
        <div className="mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center flex-1 min-w-0">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/dashboard" className="flex items-center space-x-2 mr-4 lg:mr-8">
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{APP_CONFIG.shortName}</span>
                  </div>
                  <h1 className="text-lg lg:text-xl font-bold text-primary-600 hidden sm:block whitespace-nowrap">
                    {APP_CONFIG.name}
                  </h1>
                </Link>
              </div>

              {/* Desktop Navigation - Compact on smaller screens */}
              <div className="hidden lg:flex lg:flex-1 lg:items-center lg:space-x-1 xl:space-x-4 overflow-x-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'border-primary-500 text-gray-900 bg-primary-50'
                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50'
                    } inline-flex items-center px-2 xl:px-3 py-2 border-b-2 text-xs xl:text-sm font-medium transition-all group whitespace-nowrap rounded-t`}
                    title={item.description}
                  >
                    <span className="mr-1.5 xl:mr-2 flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center space-x-2">
              {/* Desktop User Menu */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-semibold text-sm">
                      {user?.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-sm font-medium text-gray-700 leading-tight">
                      {user?.full_name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </div>
                  </div>
                  <ChevronDownIcon size={16} color={COLORS.gray[400]} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                      <div className="text-xs text-gray-400 mt-1 capitalize">Role: {user?.role}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogoutIcon size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900'
                  } flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {user?.full_name?.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.full_name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
