import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Loader2,
  Store,
  Clock
} from 'lucide-react';

interface Collection {
  id: string;
  saleId: string;
  saleNumber: string;
  shopId: string;
  shopName: string;
  amount: number;
  date: string;
  notes: string;
}

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

export default function Collections() {
  const { t, isRTL } = useLanguage();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, isAdmin, isSuperAdmin } = useAuth();

  // Load collections and sales from Firebase
  useEffect(() => {
    loadCollections();
    loadSales();
  }, [user]);

  const loadCollections = async () => {
    try {
      if (!user) return;
      const collectionsRef = isAdmin || isSuperAdmin ? collection(db, 'collections') : query(collection(db, 'collections'), where('owner', '==', user.uid));
      const querySnapshot = await getDocs(collectionsRef);
      const collectionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collection[];
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      if (!user) return;
      const salesRef = isAdmin || isSuperAdmin ? collection(db, 'sales') : query(collection(db, 'sales'), where('owner', '==', user.uid));
      const querySnapshot = await getDocs(salesRef);
      const salesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
  const filteredCollections = collections.filter(collection =>
    collection.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (collectionData: Omit<Collection, 'id'>) => {
    setLoading(true);
    try {
      if (editingCollection) {
        await updateDoc(doc(db, 'collections', editingCollection.id), collectionData);
        setCollections(collections.map(c => 
          c.id === editingCollection.id ? { ...collectionData, id: editingCollection.id } : c
        ));
      } else {
        const docRef = await addDoc(collection(db, 'collections'), { ...collectionData, owner: user?.uid });
        setCollections([...collections, { ...collectionData, id: docRef.id }]);
      }

      // Update sale status if collection is linked to a sale
      if (collectionData.saleId) {
        const saleRef = doc(db, 'sales', collectionData.saleId);
        const currentSale = sales.find(s => s.id === collectionData.saleId);
        if (currentSale) {
          const totalPaid = collections
            .filter(c => c.saleId === collectionData.saleId)
            .reduce((sum, c) => sum + c.amount, 0) + collectionData.amount;
          
          let newStatus = currentSale.status;
          if (totalPaid >= currentSale.totalAmount) {
            newStatus = 'paid';
          } else if (totalPaid > 0) {
            newStatus = 'partial';
          }
          
          await updateDoc(saleRef, {
            paidAmount: totalPaid,
            status: newStatus,
          });
        }
      }
      
      setShowModal(false);
      setEditingCollection(null);
    } catch (error) {
      console.error('Error saving collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'collections', id));
        setCollections(collections.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting collection:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.collections}</h1>
          <p className="text-gray-600">Track payments and collections from shops</p>
        </div>
        <button
          onClick={() => { setEditingCollection(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          {t.addCollection}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-gray-800">MVR {totalCollected.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">MTD: MVR {collections.filter(c => c.date >= getMTDDate()).reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()} | YTD: MVR {collections.filter(c => c.date >= getYTDDate()).reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Collections</p>
          <p className="text-2xl font-bold text-gray-800">{collections.length}</p>
          <p className="text-xs text-gray-500 mt-2">MTD: {collections.filter(c => c.date >= getMTDDate()).length} | YTD: {collections.filter(c => c.date >= getYTDDate()).length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-orange-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Average per Collection</p>
          <p className="text-2xl font-bold text-gray-800">
            MVR {collections.length > 0 ? Math.round(totalCollected / collections.length).toLocaleString() : 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-gray-800">MVR {sales.reduce((sum, s) => sum + ((s.totalAmount || 0) - (s.paidAmount || 0)), 0).toLocaleString()}</p>
        </motion.div>
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

      {/* Collections List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.shopName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.amount}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.notes}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCollections.map((collection) => (
                  <motion.tr
                    key={collection.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{collection.shopName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">MVR {collection.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {collection.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {collection.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingCollection(collection); setShowModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(collection.id)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-purple-700" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredCollections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{collection.shopName}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingCollection(collection); setShowModal(true); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t.amount}</span>
                    <span className="font-semibold text-green-600">MVR {collection.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {t.date}
                    </span>
                    <span className="text-sm text-gray-900">{collection.date}</span>
                  </div>
                  {collection.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{collection.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {showModal && (
        <CollectionModal
          collection={editingCollection}
          sales={sales}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingCollection(null); }}
          t={t}
        />
      )}
    </div>
  );
}

function CollectionModal({ 
  collection, 
  sales,
  onSave, 
  onClose, 
  t
}: { 
  collection: Collection | null;
  sales: any[];
  onSave: (data: Omit<Collection, 'id'>) => void;
  onClose: () => void;
  t: any;
}) {
  const [formData, setFormData] = useState({
    saleId: collection?.saleId || '',
    saleNumber: collection?.saleNumber || '',
    shopId: collection?.shopId || '',
    shopName: collection?.shopName || '',
    amount: collection?.amount || '',
    date: collection?.date || '',
    notes: collection?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      saleId: formData.saleId,
      saleNumber: formData.saleNumber,
      shopId: formData.shopId,
      shopName: formData.shopName,
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes,
    });
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
            {collection ? t.editCollection : t.addCollection}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale (Optional)
            </label>
            <select
              value={formData.saleId}
              onChange={(e) => {
                const selectedSale = sales.find(s => s.id === e.target.value);
                setFormData({
                  ...formData,
                  saleId: e.target.value,
                  saleNumber: selectedSale?.saleNumber || '',
                  shopId: selectedSale?.shopId || '',
                  shopName: selectedSale?.shopName || '',
                  amount: selectedSale?.totalAmount || formData.amount,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select sale</option>
              {sales.filter(s => s.status !== 'paid').map((sale) => (
                <option key={sale.id} value={sale.id}>{sale.saleNumber} - {sale.recipeName || sale.productName} ({sale.shopName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.shopName}
            </label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.amount}
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.date}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.notes}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
