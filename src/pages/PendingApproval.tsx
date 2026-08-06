import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Phone, MessageCircle, LogOut, RefreshCw, CheckCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PendingApproval() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (userData?.status) {
        setCurrentStatus(userData.status);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkStatus();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const contactNumber = '+9609795529';
  const whatsappUrl = `https://wa.me/${contactNumber.replace('+', '')}`;
  const viberUrl = `viber://chat?number=${contactNumber}`;

  // If approved, show approved screen
  if (currentStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block flex-1"
          >
            <img src="/storyset/fruit shop-cuate.svg" alt="Fruit Shop Illustration" className="w-full max-w-md mx-auto" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex-1"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Approved!</h1>
              <p className="text-gray-600">
                Your account has been approved. You can now login to access all features.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Login to Dashboard
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                {t.logout || 'Logout'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If rejected, show rejected screen
  if (currentStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block flex-1"
          >
            <img src="/storyset/Coffee shop-bro.svg" alt="Coffee Shop Illustration" className="w-full max-w-md mx-auto" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex-1"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Clock className="w-10 h-10 text-red-600" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Rejected</h1>
              <p className="text-gray-600">
                Your account registration was rejected. Please contact the administrator for more information.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                {t.logout || 'Logout'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Pending screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block flex-1"
        >
          <img src="/storyset/Farmers market-rafiki.svg" alt="Farmers Market Illustration" className="w-full max-w-md mx-auto" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex-1"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Clock className="w-10 h-10 text-orange-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.pendingApproval || 'Account Pending Approval'}</h1>
            <p className="text-gray-600">
              {t.pendingApprovalMessage || 'Your account is waiting for admin approval. Please contact the administrator to activate your account.'}
            </p>
          </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800 font-medium mb-2">
            {t.contactAdmin || 'Contact Administrator:'}
          </p>
          <p className="text-lg font-bold text-orange-900 mb-4">{contactNumber}</p>
          
          <div className="flex gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
            <a
              href={viberUrl}
              className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Viber
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {t.checking || 'Checking...'}
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                {t.checkStatus || 'Check Approval Status'}
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            {t.logout || 'Logout'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t.userEmail || 'Email'}: {user?.email}</p>
          <p className="mt-1">{t.registeredOn || 'Registered on'}: {new Date().toLocaleDateString()}</p>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
