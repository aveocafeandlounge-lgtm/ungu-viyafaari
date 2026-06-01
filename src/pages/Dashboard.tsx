import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Store, 
  TrendingUp,
  Package,
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
    totalSales: 45000,
    totalCollections: 38000,
    pendingPayments: 7000,
    activeShops: 12,
  };

  const salesData = [
    { name: 'Jan', sales: 4000, collections: 3200 },
    { name: 'Feb', sales: 4500, collections: 3800 },
    { name: 'Mar', sales: 5200, collections: 4100 },
    { name: 'Apr', sales: 4800, collections: 3900 },
    { name: 'May', sales: 5500, collections: 4600 },
    { name: 'Jun', sales: 6000, collections: 5200 },
  ];

  const shopPerformance = [
    { name: 'Shop A', value: 12000 },
    { name: 'Shop B', value: 9500 },
    { name: 'Shop C', value: 8000 },
    { name: 'Shop D', value: 6500 },
    { name: 'Others', value: 9000 },
  ];

  const productSales = [
    { name: 'Hedhika', value: 35 },
    { name: 'Meals', value: 25 },
    { name: 'Snacks', value: 20 },
    { name: 'Drinks', value: 15 },
    { name: 'Others', value: 5 },
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

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
          color="bg-red-500"
          trend="+12%"
        />
        <StatCard
          title={t.totalCollections}
          value={`MVR ${stats.totalCollections.toLocaleString()}`}
          icon={ShoppingCart}
          color="bg-green-500"
          trend="+8%"
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
          trend="+2"
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
              <Line type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="collections" stroke="#22c55e" strokeWidth={2} />
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
              <Bar dataKey="value" fill="#ef4444" />
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
            {[
              { name: 'Mas Huni', stock: 5, unit: 'packs' },
              { name: 'Bis Keeku', stock: 8, unit: 'packs' },
              { name: 'Gulha', stock: 12, unit: 'pieces' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.stock} {item.unit} remaining</p>
                  </div>
                </div>
                <span className="text-orange-600 font-medium">Low Stock</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
