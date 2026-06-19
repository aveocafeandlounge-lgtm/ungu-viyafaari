import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Store, 
  TrendingUp,
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

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalSales: 0,
    salesMTD: 0,
    salesYTD: 0,
    salesToday: 0,
    totalCollections: 0,
    collectionsMTD: 0,
    collectionsYTD: 0,
    collectionsToday: 0,
    pendingPayments: 0,
    activeShops: 0,
    availableFunds: 0,
    totalPurchases: 0,
    purchasesMTD: 0,
    purchasesYTD: 0,
    purchasesToday: 0,
    totalRecipeCost: 0,
    totalBatchCost: 0,
    totalBatchRevenue: 0,
    profit: 0,
    profitMargin: 0,
  });
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'mtd' | 'ytd' | 'all' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [usersSummary, setUsersSummary] = useState<any[]>([]);

  const { user, loading: authLoading, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [dateFilter, customStartDate, customEndDate, user]);

  const loadDashboardData = async () => {
    try {
      const mtdDate = getMTDDate();
      const ytdDate = getYTDDate();

      if (!user) return;
      const canViewAll = isAdmin || isSuperAdmin;

      // Load sales
      const salesRef = canViewAll ? collection(db, 'sales') : query(collection(db, 'sales'), where('owner', '==', user.uid));
      const salesSnapshot = await getDocs(salesRef);
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
      const collectionsRef = canViewAll ? collection(db, 'collections') : query(collection(db, 'collections'), where('owner', '==', user.uid));
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsData = collectionsSnapshot.docs.map(doc => doc.data());
      const totalCollections = collectionsData.reduce((sum, c) => sum + (c.amount || 0), 0);
      const collectionsMTD = collectionsData
        .filter(c => c.collectionDate >= mtdDate)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const collectionsYTD = collectionsData
        .filter(c => c.collectionDate >= ytdDate)
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      // Load shops
      const shopsRef = canViewAll ? collection(db, 'shops') : query(collection(db, 'shops'), where('owner', '==', user.uid));
      const shopsSnapshot = await getDocs(shopsRef);
      const activeShops = shopsSnapshot.size;

      // Load money transactions
      const moneyRef = canViewAll ? collection(db, 'money') : query(collection(db, 'money'), where('owner', '==', user.uid));
      const moneySnapshot = await getDocs(moneyRef);
      const moneyData = moneySnapshot.docs.map(doc => doc.data());
      const availableFunds = moneyData.reduce((sum, m) => sum + (m.amount || 0), 0);

      // Load purchases
      const purchasesRef = canViewAll ? collection(db, 'purchases') : query(collection(db, 'purchases'), where('owner', '==', user.uid));
      const purchasesSnapshot = await getDocs(purchasesRef);
      const purchasesData = purchasesSnapshot.docs.map(doc => doc.data());
      const totalPurchases = purchasesData.reduce((sum, p) => sum + (p.totalCost || 0), 0);
      const purchasesMTD = purchasesData
        .filter(p => p.purchaseDate >= mtdDate)
        .reduce((sum, p) => sum + (p.totalCost || 0), 0);
      const purchasesYTD = purchasesData
        .filter(p => p.purchaseDate >= ytdDate)
        .reduce((sum, p) => sum + (p.totalCost || 0), 0);

      // Load recipes
      const recipesRef = canViewAll ? collection(db, 'recipes') : query(collection(db, 'recipes'), where('owner', '==', user.uid));
      const recipesSnapshot = await getDocs(recipesRef);
      const recipesData = recipesSnapshot.docs.map(doc => doc.data());
      const totalRecipeCost = recipesData.reduce((sum, r) => {
        const ingredientsCost = r.ingredients?.reduce((is: number, i: any) => is + (i.price || 0), 0) || 0;
        return sum + ingredientsCost;
      }, 0);

      // Load batches
      const batchesRef = canViewAll ? collection(db, 'batches') : query(collection(db, 'batches'), where('owner', '==', user.uid));
      const batchesSnapshot = await getDocs(batchesRef);
      const batchesData = batchesSnapshot.docs.map(doc => doc.data());
      const totalBatchCost = batchesData.reduce((sum, b) => sum + (b.cost || 0), 0);
      const totalBatchRevenue = batchesData.reduce((sum, b) => sum + (b.totalRevenue || 0), 0);

      // Calculate profit and profit margin
      const profit = totalBatchRevenue - totalBatchCost;
      const profitMargin = totalBatchRevenue > 0 ? (profit / totalBatchRevenue) * 100 : 0;

      const todayDate = getTodayDate();
      const salesToday = salesData
        .filter(s => s.saleDate >= todayDate)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const collectionsToday = collectionsData
        .filter(c => c.collectionDate >= todayDate)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const purchasesToday = purchasesData
        .filter(p => p.purchaseDate >= todayDate)
        .reduce((sum, p) => sum + (p.totalCost || 0), 0);

      setStats({
        totalSales,
        salesMTD,
        salesYTD,
        salesToday,
        totalCollections,
        collectionsMTD,
        collectionsYTD,
        collectionsToday,
        pendingPayments,
        activeShops,
        availableFunds,
        totalPurchases,
        purchasesMTD,
        purchasesYTD,
        purchasesToday,
        totalRecipeCost,
        totalBatchCost,
        totalBatchRevenue,
        profit,
        profitMargin,
      });

      // If admin, load per-user summaries
      if (canViewAll) {
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          const users = usersSnap.docs.map(d => ({ uid: d.id, ...(d.data() || {}) }));

          const summaries = await Promise.all(users.map(async (u) => {
            const [productsSnap, purchasesSnap, recipesSnap, batchesSnap, salesSnap, shopsSnap, collectionsSnap, moneySnap] = await Promise.all([
              getDocs(query(collection(db, 'products'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'purchases'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'recipes'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'batches'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'sales'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'shops'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'collections'), where('owner', '==', u.uid))),
              getDocs(query(collection(db, 'money'), where('owner', '==', u.uid))),
            ]);

            return {
              uid: u.uid,
              email: u.email || '',
              displayName: u.fullName || u.displayName || '',
              counts: {
                products: productsSnap.size,
                purchases: purchasesSnap.size,
                recipes: recipesSnap.size,
                batches: batchesSnap.size,
                sales: salesSnap.size,
                shops: shopsSnap.size,
                collections: collectionsSnap.size,
                money: moneySnap.size,
              }
            };
          }));

          setUsersSummary(summaries);
        } catch (err) {
          console.error('Error loading users summary:', err);
        }
      } else {
        setUsersSummary([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount) return;
    try {
      if (!user) return;
      await addDoc(collection(db, 'money'), {
        amount: Number(topUpAmount),
        type: 'top-up',
        date: new Date().toISOString(),
        notes: 'Personal money top-up for inventory',
        owner: user.uid,
      });
      setTopUpAmount('');
      setShowTopUpModal(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error adding top-up:', error);
    }
  };

  const comparisonData = [
    { name: 'Sales', value: stats.totalSales },
    { name: 'Purchases', value: stats.totalPurchases },
    { name: 'Recipe Cost', value: stats.totalRecipeCost },
    { name: 'Batch Revenue', value: stats.totalBatchRevenue },
    { name: 'Batch Cost', value: stats.totalBatchCost },
  ];

  const profitData = [
    { name: 'Revenue', value: stats.totalBatchRevenue },
    { name: 'Cost', value: stats.totalBatchCost },
    { name: 'Profit', value: stats.profit },
  ];

  const COLORS = ['#6B46C1', '#0F766E', '#eab308', '#22c55e', '#3b82f6'];

  const StatCard = ({
    title,
    value,
    mtd,
    ytd,
    today,
    icon: Icon,
    color,
    trend
  }: {
    title: string;
    value: string | number;
    mtd?: string | number;
    ytd?: string | number;
    today?: string | number;
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
      {(mtd !== undefined || ytd !== undefined || today !== undefined) && (
        <div className="mt-2 space-y-1">
          {today !== undefined && (
            <p className="text-xs text-gray-500">Today: {typeof today === 'number' ? `MVR ${today.toLocaleString()}` : today}</p>
          )}
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

      {/* Date Filter Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Report Period:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('mtd')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'mtd'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              MTD
            </button>
            <button
              onClick={() => setDateFilter('ytd')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'ytd'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              YTD
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
          </div>
          {dateFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.totalSales}
          value={`MVR ${
            (dateFilter === 'today' ? stats.salesToday :
            dateFilter === 'mtd' ? stats.salesMTD :
            dateFilter === 'ytd' ? stats.salesYTD :
            stats.totalSales).toLocaleString()
          }`}
          mtd={stats.salesMTD}
          ytd={stats.salesYTD}
          today={stats.salesToday}
          icon={DollarSign}
          color="bg-purple-600"
        />
        <StatCard
          title="Total Purchases"
          value={`MVR ${
            (dateFilter === 'today' ? stats.purchasesToday :
            dateFilter === 'mtd' ? stats.purchasesMTD :
            dateFilter === 'ytd' ? stats.purchasesYTD :
            stats.totalPurchases).toLocaleString()
          }`}
          mtd={stats.purchasesMTD}
          ytd={stats.purchasesYTD}
          today={stats.purchasesToday}
          icon={ShoppingCart}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Recipe Cost"
          value={`MVR ${stats.totalRecipeCost.toLocaleString()}`}
          icon={Wallet}
          color="bg-orange-500"
        />
        <StatCard
          title="Total Batch Revenue"
          value={`MVR ${stats.totalBatchRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-green-600"
        />
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-600 text-sm mb-2">Sales vs Purchases</h3>
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {stats.totalSales > stats.totalPurchases ? '+' : ''}MVR {(stats.totalSales - stats.totalPurchases).toLocaleString()}
          </p>
          <p className={`text-sm ${stats.totalSales > stats.totalPurchases ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalPurchases > 0 ? ((stats.totalSales - stats.totalPurchases) / stats.totalPurchases * 100).toFixed(1) : 0}% difference
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-600 text-sm mb-2">Sales vs Recipe Cost</h3>
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {stats.totalSales > stats.totalRecipeCost ? '+' : ''}MVR {(stats.totalSales - stats.totalRecipeCost).toLocaleString()}
          </p>
          <p className={`text-sm ${stats.totalSales > stats.totalRecipeCost ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalRecipeCost > 0 ? ((stats.totalSales - stats.totalRecipeCost) / stats.totalRecipeCost * 100).toFixed(1) : 0}% difference
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-600 text-sm mb-2">Profit Margin</h3>
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {stats.profitMargin.toFixed(1)}%
          </p>
          <p className={`text-sm ${stats.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
            MVR {stats.profit.toLocaleString()} profit
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        {/* Sales vs Purchases Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales vs Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData.slice(0, 2)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6B46C1" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Profit Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={comparisonData.slice(1, 3)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {comparisonData.slice(1, 3).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue vs Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Cost</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData.slice(3, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Per-user summary for admins */}
      {(isAdmin || isSuperAdmin) && usersSummary.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Users Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Products</th>
                  <th className="px-3 py-2">Purchases</th>
                  <th className="px-3 py-2">Recipes</th>
                  <th className="px-3 py-2">Batches</th>
                  <th className="px-3 py-2">Sales</th>
                  <th className="px-3 py-2">Shops</th>
                  <th className="px-3 py-2">Collections</th>
                  <th className="px-3 py-2">Money Txns</th>
                </tr>
              </thead>
              <tbody>
                {usersSummary.map((u) => (
                  <tr key={u.uid} className="border-t">
                    <td className="px-3 py-2">{u.displayName || u.email}</td>
                    <td className="px-3 py-2">{u.counts.products}</td>
                    <td className="px-3 py-2">{u.counts.purchases}</td>
                    <td className="px-3 py-2">{u.counts.recipes}</td>
                    <td className="px-3 py-2">{u.counts.batches}</td>
                    <td className="px-3 py-2">{u.counts.sales}</td>
                    <td className="px-3 py-2">{u.counts.shops}</td>
                    <td className="px-3 py-2">{u.counts.collections}</td>
                    <td className="px-3 py-2">{u.counts.money}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
