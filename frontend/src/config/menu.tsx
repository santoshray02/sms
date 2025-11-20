/**
 * Navigation Menu Configuration
 * Organized menu items with icons and permissions
 */

import { ReactNode } from 'react';
import {
  DashboardIcon,
  StudentsIcon,
  GuardiansIcon,
  FeesIcon,
  ConcessionsIcon,
  PaymentsIcon,
  ReportsIcon,
  SettingsIcon,
  TransportIcon,
  CalendarIcon,
} from '../components/Icons';

export interface MenuItem {
  name: string;
  href: string;
  icon: ReactNode;
  description?: string;
  requiresAuth: boolean;
  roles?: string[]; // If specified, only these roles can see this item
  badge?: string; // Optional badge text
  category?: string; // For grouping menu items
}

// Professional Icon Library
export const MenuIcons = {
  Dashboard: <DashboardIcon size={20} />,
  Students: <StudentsIcon size={20} />,
  Guardians: <GuardiansIcon size={20} />,
  Fees: <FeesIcon size={20} />,
  Concessions: <ConcessionsIcon size={20} />,
  Payments: <PaymentsIcon size={20} />,
  Reports: <ReportsIcon size={20} />,
  Settings: <SettingsIcon size={20} />,
  Transport: <TransportIcon size={20} />,
  Calendar: <CalendarIcon size={20} />,
};

/**
 * Main Navigation Menu
 */
export const MAIN_MENU: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: MenuIcons.Dashboard,
    description: 'Overview and statistics',
    requiresAuth: true,
    category: 'main',
  },
  {
    name: 'Students',
    href: '/students',
    icon: MenuIcons.Students,
    description: 'Student management',
    requiresAuth: true,
    category: 'main',
  },
  {
    name: 'Guardians',
    href: '/guardians',
    icon: MenuIcons.Guardians,
    description: 'Parent/Guardian management',
    requiresAuth: true,
    category: 'main',
  },
  {
    name: 'Fees',
    href: '/fees',
    icon: MenuIcons.Fees,
    description: 'Fee structures and monthly fees',
    requiresAuth: true,
    category: 'finance',
  },
  {
    name: 'Concessions',
    href: '/concessions',
    icon: MenuIcons.Concessions,
    description: 'Scholarships and fee waivers',
    requiresAuth: true,
    category: 'finance',
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: MenuIcons.Payments,
    description: 'Payment records and receipts',
    requiresAuth: true,
    category: 'finance',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: MenuIcons.Reports,
    description: 'Financial and academic reports',
    requiresAuth: true,
    category: 'reports',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: MenuIcons.Settings,
    description: 'School info, academic years, and transport',
    requiresAuth: true,
    roles: ['admin'], // Only admins can access
    category: 'admin',
  },
];

/**
 * Filter menu items based on user role
 */
export const getMenuItemsForUser = (userRole?: string): MenuItem[] => {
  return MAIN_MENU.filter((item) => {
    // If roles are specified, check if user has one of them
    if (item.roles && item.roles.length > 0) {
      return userRole && item.roles.includes(userRole);
    }
    // Otherwise, item is accessible to all authenticated users
    return true;
  });
};

/**
 * Group menu items by category
 */
export const getGroupedMenuItems = (
  menuItems: MenuItem[]
): Record<string, MenuItem[]> => {
  return menuItems.reduce((groups, item) => {
    const category = item.category || 'main';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, MenuItem[]>);
};
