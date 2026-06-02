import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingCart,
  Box, 
  DollarSign, 
  BookOpen, 
  BarChart3,
  Receipt
} from 'lucide-react';

export default function BottomNav() {
  const { t } = useLanguage();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t.dashboard },
    { path: '/shops', icon: Store, label: t.shops },
    { path: '/purchases', icon: ShoppingCart, label: 'Purchases' },
    { path: '/recipes', icon: BookOpen, label: t.recipes },
    { path: '/batches', icon: Box, label: t.batches },
    { path: '/sales', icon: Receipt, label: 'Sales' },
    { path: '/collections', icon: DollarSign, label: t.collections },
    { path: '/reports', icon: BarChart3, label: t.reports },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-purple-700'
                  : 'text-gray-600'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
