import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Globe, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { signOut } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'dv' : 'en');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-red-600">{t.appName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">{language === 'en' ? 'EN' : 'DV'}</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">{t.logout}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
