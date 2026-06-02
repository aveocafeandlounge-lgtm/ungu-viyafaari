import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Store, 
  TrendingUp,
  AlertCircle,
  Plus,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Helper functions for MTD/YTD calculations
const getMTDDate = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDayOfMonth.toISOString().split('T')[0];
};

const getYTDDate = () => {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
  return firstDayOfYear.toISOString().split('T')[0];
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalSales: 0,
    salesMTD: 0,
    salesYTD: 0,
    totalCollections: 0,
    collectionsMTD: 0,
    collectionsYTD: 0,
    pendingPayments: 0,
    activeShops: 0,
    availableFunds: 0,
  });
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const mtdDate = getMTDDate();
      const ytdDate = getYTDDate();

      // Load sales
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      const salesData = salesSnapshot.docs.map(doc => doc.data());
      const totalSales = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const salesMTD = salesData
        .filter(s => s.saleDate >= mtdDate)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const salesYTD = salesData
        .filter(s => s.saleDate >= ytdDate)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const pendingPayments = salesData
        .filter(s => s.status === 'pending' || s.status === 'partial')
        .reduce((sum, s) => sum + ((s.totalAmount || 0) - (s.paidAmount || 0)), 0);

      // Load collections
      const collectionsSnapshot = await getDocs(collection(db, 'collections'));
      const collectionsData = collectionsSnapshot.docs.map(doc => doc.data());
      const totalCollections = collectionsData.reduce((sum, c) => sum + (c.amount || 0), 0);
      const collectionsMTD = collectionsData
        .filter(c => c.collectionDate >= mtdDate)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const collectionsYTD = collectionsData
        .filter(c => c.collectionDate >= ytdDate)
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      // Load shops
      const shopsSnapshot = await getDocs(collection(db, 'shops'));
      const activeShops = shopsSnapshot.size;

      // Load money transactions
      const moneySnapshot = await getDocs(collection(db, 'money'));
      const moneyData = moneySnapshot.docs.map(doc => doc.data());
      const availableFunds = moneyData.reduce((sum, m) => sum + (m.amount || 0), 0);

      setStats({
        totalSales,
        salesMTD,
        salesYTD,
        totalCollections,
        collectionsMTD,
        collectionsYTD,
        pendingPayments,
        activeShops,
        availableFunds,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount) return;
    try {
      await addDoc(collection(db, 'money'), {
        amount: Number(topUpAmount),
        type: 'top-up',
        date: new Date().toISOString(),
        notes: 'Personal money top-up for inventory',
      });
      setTopUpAmount('');
      setShowTopUpModal(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error adding top-up:', error);
    }
  };

  const salesData = [
    { name: 'Jan', sales: 0, collections: 0 },
    { name: 'Feb', sales: 0, collections: 0 },
    { name: 'Mar', sales: 0, collections: 0 },
    { name: 'Apr', sales: 0, collections: 0 },
    { name: 'May', sales: 0, collections: 0 },
    { name: 'Jun', sales: 0, collections: 0 },
  ];

  const shopPerformance = [
    { name: 'Shop A', value: 0 },
    { name: 'Shop B', value: 0 },
    { name: 'Shop C', value: 0 },
    { name: 'Shop D', value: 0 },
    { name: 'Others', value: 0 },
  ];

  const productSales = [
    { name: 'Hedhika', value: 0 },
    { name: 'Meals', value: 0 },
    { name: 'Snacks', value: 0 },
    { name: 'Drinks', value: 0 },
    { name: 'Others', value: 0 },
  ];

  const COLORS = ['#6B46C1', '#0F766E', '#eab308', '#22c55e', '#3b82f6'];

  const StatCard = ({ 
    title, 
    value, 
    mtd, 
    ytd,
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    mtd?: string | number;
    ytd?: string | number;
    icon: any; 
    color: string; 
    trend?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-green-600 text-sm font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {(mtd !== undefined || ytd !== undefined) && (
        <div className="mt-2 space-y-1">
          {mtd !== undefined && (
            <p className="text-xs text-gray-500">MTD: {typeof mtd === 'number' ? `MVR ${mtd.toLocaleString()}` : mtd}</p>
          )}
          {ytd !== undefined && (
            <p className="text-xs text-gray-500">YTD: {typeof ytd === 'number' ? `MVR ${ytd.toLocaleString()}` : ytd}</p>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.dashboard}</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t.totalSales}
          value={`MVR ${stats.totalSales.toLocaleString()}`}
          mtd={stats.salesMTD}
          ytd={stats.salesYTD}
          icon={DollarSign}
          color="bg-purple-600"
        />
        <StatCard
          title={t.totalCollections}
          value={`MVR ${stats.totalCollections.toLocaleString()}`}
          mtd={stats.collectionsMTD}
          ytd={stats.collectionsYTD}
          icon={ShoppingCart}
          color="bg-teal-600"
        />
        <StatCard
          title={t.pendingPayments}
          value={`MVR ${stats.pendingPayments.toLocaleString()}`}
          icon={Clock}
          color="bg-orange-500"
        />
        <StatCard
          title={t.activeShops}
          value={stats.activeShops}
          icon={Store}
          color="bg-blue-500"
        />
        <StatCard
          title="Available Funds"
          value={`MVR ${stats.availableFunds.toLocaleString()}`}
          icon={Wallet}
          color="bg-green-600"
        />
      </div>

      {/* Top Up Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowTopUpModal(true)}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Top Up Inventory Funds
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.salesOverTime}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#6B46C1" strokeWidth={2} />
              <Line type="monotone" dataKey="collections" stroke="#0F766E" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Shop Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.shopPerformance}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shopPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6B46C1" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Product Sales Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.productPerformance}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productSales}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productSales.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            {t.lowStockAlert}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-center p-8 text-gray-500">
              No low stock alerts
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Top Up Inventory Funds</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (MVR)</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  This will add personal money to your available funds for inventory purchases.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
                >
                  Add Funds
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
