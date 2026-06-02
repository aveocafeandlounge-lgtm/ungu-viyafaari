import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Store, 
  Phone, 
  Mail, 
  MapPin,
  Loader2,
  DollarSign,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  totalPurchases: number;
  outstandingBalance: number;
}

export default function Shops() {
  const { t, isRTL } = useLanguage();
  const [shops, setShops] = useState<Shop[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load shops from Firebase
  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'shops'));
      const shopsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shop[];
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (shopData: Omit<Shop, 'id' | 'totalPurchases' | 'outstandingBalance'>) => {
    setLoading(true);
    try {
      if (editingShop) {
        await updateDoc(doc(db, 'shops', editingShop.id), shopData);
        setShops(shops.map(s => 
          s.id === editingShop.id 
            ? { ...shopData, id: editingShop.id, totalPurchases: editingShop.totalPurchases, outstandingBalance: editingShop.outstandingBalance }
            : s
        ));
      } else {
        const docRef = await addDoc(collection(db, 'shops'), { ...shopData, totalPurchases: 0, outstandingBalance: 0 });
        setShops([...shops, { ...shopData, id: docRef.id, totalPurchases: 0, outstandingBalance: 0 }]);
      }
      
      setShowModal(false);
      setEditingShop(null);
    } catch (error) {
      console.error('Error saving shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'shops', id));
        setShops(shops.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting shop:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.shops}</h1>
          <p className="text-gray-600">Manage your retail partners and customers</p>
        </div>
        <button
          onClick={() => { setEditingShop(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          {t.addShop}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-600">
              <Store className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Shops</h3>
          <p className="text-2xl font-bold text-gray-800">{shops.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-teal-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Purchases</h3>
          <p className="text-2xl font-bold text-gray-800">MVR {shops.reduce((sum, s) => sum + (s.totalPurchases || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Outstanding Balance</h3>
          <p className="text-2xl font-bold text-gray-800">MVR {shops.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Active Shops</h3>
          <p className="text-2xl font-bold text-gray-800">{shops.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'left-auto right-3' : ''}`} />
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : ''}`}
        />
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Store className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingShop(shop); setShowModal(true); }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-purple-700" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 text-lg mb-3">{shop.name}</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{shop.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{shop.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
                  <p className="font-semibold text-gray-800">MVR {shop.totalPurchases.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t.outstandingBalance}</p>
                  <p className={`font-semibold ${shop.outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    MVR {shop.outstandingBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shop Modal */}
      {showModal && (
        <ShopModal
          shop={editingShop}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingShop(null); }}
          t={t}
        />
      )}
    </div>
  );
}

function ShopModal({ 
  shop, 
  onSave, 
  onClose, 
  t
}: { 
  shop: Shop | null;
  onSave: (data: Omit<Shop, 'id' | 'totalPurchases' | 'outstandingBalance'>) => void;
  onClose: () => void;
  t: any;
}) {
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    address: shop?.address || '',
    phone: shop?.phone || '',
    email: shop?.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {shop ? t.editShop : t.addShop}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.shopName}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.address}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.phone}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.shopEmail}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            >
              {t.save}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
