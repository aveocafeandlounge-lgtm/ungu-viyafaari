import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.settings}</h1>
        <p className="text-gray-600">Manage your account and app preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
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
          Language
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              language === 'en' ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
          >
            <p className="font-medium">English</p>
            <p className="text-sm text-gray-600">EN</p>
          </button>
          <button
            onClick={() => setLanguage('dv')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              language === 'dv' ? 'border-red-500 bg-red-50' : 'border-gray-200'
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
          Notifications
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Low stock alerts</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Payment reminders</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Batch expiry alerts</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 rounded" />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security (Admin Only)
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
