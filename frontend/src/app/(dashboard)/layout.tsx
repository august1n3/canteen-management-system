"use client"
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  ClipboardListIcon,
  ChartBarIcon,
  CogIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
  BellIcon
} from '@heroicons/react/outline';
import { AuthProvider } from '@/contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavigationItems = () => {
    console.log(user);
    if (!user) return [];

    switch (user.role) {
      case 'STUDENT':
        return [
          { name: 'Menu', href: '/student/', icon: HomeIcon },
          { name: 'Cart', href: '/student/cart', icon: ShoppingCartIcon },
          { name: 'My Orders', href: '/student/history', icon: ClipboardListIcon },
          { name: 'Track Order', href: '/student/order-tracking', icon: ClipboardListIcon },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', href: '/Staff/Dashboard', icon: HomeIcon },
          { name: 'Orders', href: '/Staff/OrderManagement', icon: ClipboardListIcon },
          { name: 'Menu Management', href: '/Staff/MenuManagement', icon: CogIcon },
          { name: 'Payments', href: '/Staff/PaymentProcessing', icon: ChartBarIcon },
        ];
      case 'KITCHEN':
        return [
          { name: 'Kitchen Dashboard', href: '/Kitchen/KitchenDashboard', icon: HomeIcon },
          { name: 'Order Queue', href: '/Kitchen/OrderQueue', icon: ClipboardListIcon },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/Admin/AdminDashboard', icon: HomeIcon },
          { name: 'User Management', href: '/Admin/UserManagement', icon: CogIcon },
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <span className="text-xl font-semibold">Canteen System</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium border-r-4 ${
                  pathname === item.href
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:shadow-lg">
        <div className="flex items-center h-16 px-6 border-b">
          <span className="text-xl font-semibold text-gray-900">Canteen System</span>
        </div>
        <nav className="mt-6 flex-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium border-r-4 ${
                pathname === item.href
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* User profile section */}
        <div className="border-t p-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
          >
            <LogoutIcon className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm lg:static lg:overflow-y-visible">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="relative flex justify-between h-16">
              <div className="flex">
                <button
                  className="lg:hidden px-4 text-gray-500 focus:outline-none focus:text-gray-900"
                  onClick={() => setSidebarOpen(true)}
                >
                  <MenuIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex items-center">
                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <BellIcon className="h-6 w-6" />
                </button>
                
                {/* Mobile user menu */}
                <div className="lg:hidden ml-4">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

// TODO: Add breadcrumb navigation for better UX
// TODO: Implement notification system with real-time updates
// TODO: Add user avatar upload functionality
// TODO: Implement role-based menu customization
// TODO: Add quick actions/shortcuts in the header