import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Store, 
  TrendingUp,
  AlertCircle
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

export default function Dashboard() {
  const { t } = useLanguage();

  // Mock data - replace with real Firebase data
  const stats = {
    totalSales: 0,
    totalCollections: 0,
    pendingPayments: 0,
    activeShops: 0,
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
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
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
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.dashboard}</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.totalSales}
          value={`MVR ${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="bg-purple-600"
        />
        <StatCard
          title={t.totalCollections}
          value={`MVR ${stats.totalCollections.toLocaleString()}`}
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
    </div>
  );
}
