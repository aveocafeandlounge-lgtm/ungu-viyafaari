import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Globe
} from 'lucide-react';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.settings}</h1>
          <p className="text-gray-600">{t.manageAccountPreferences || 'Manage your account and app preferences'}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-80"
        >
          <img src="/storyset/Eco%20shopping-amico.svg" alt="Settings Illustration" className="w-full" />
        </motion.div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          {t.profile || 'Profile'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium text-gray-800">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <p className="font-medium text-gray-800 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t.language || 'Language'}
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              language === 'en' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}
          >
            <p className="font-medium">English</p>
            <p className="text-sm text-gray-600">EN</p>
          </button>
          <button
            onClick={() => setLanguage('dv')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              language === 'dv' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}
          >
            <p className="font-medium">ދިވެހި</p>
            <p className="text-sm text-gray-600">DV</p>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t.notifications || 'Notifications'}
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">{t.lowStockAlerts || 'Low stock alerts'}</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">{t.paymentReminders || 'Payment reminders'}</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">{t.batchExpiryAlerts || 'Batch expiry alerts'}</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 rounded" />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t.security || 'Security'} (Admin Only)
          </h3>
          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
              Manage users
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
              View audit logs
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
              Export data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
