import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Box, 
  DollarSign, 
  BookOpen, 
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, isRTL } = useLanguage();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t.dashboard },
    { path: '/products', icon: Package, label: t.products },
    { path: '/shops', icon: Store, label: t.shops },
    { path: '/batches', icon: Box, label: t.batches },
    { path: '/collections', icon: DollarSign, label: t.collections },
    { path: '/recipes', icon: BookOpen, label: t.recipes },
    { path: '/reports', icon: BarChart3, label: t.reports },
    { path: '/settings', icon: Settings, label: t.settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isLargeScreen ? 0 : (isOpen ? 0 : (isRTL ? '100%' : '-100%'))
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-64 bg-white border-r border-gray-200 z-50 lg:static lg:translate-x-0 lg:z-0`}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-bold text-red-600">{t.appName}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
