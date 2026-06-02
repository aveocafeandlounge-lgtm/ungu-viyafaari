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
  Box, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  remaining: number;
  productionDate: string;
  expiryDate: string;
  cost: number;
  status: 'active' | 'expired' | 'low-stock';
  ingredientsUsed?: Array<{
    purchaseId: string;
    itemName: string;
    quantityUsed: number;
    unit: string;
  }>;
}

export default function Batches() {
  const { t, isRTL } = useLanguage();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load batches, products, and shops from Firebase
  useEffect(() => {
    loadBatches();
    loadProducts();
    loadShops();
  }, []);

  const loadBatches = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'batches'));
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Batch[];
      setBatches(batchesData);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadShops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'shops'));
      const shopsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (batchData: Omit<Batch, 'id' | 'status'>) => {
    setLoading(true);
    try {
      const status = batchData.remaining === 0 ? 'expired' : 
                     batchData.remaining < batchData.quantity * 0.2 ? 'low-stock' : 'active';
      
      if (editingBatch) {
        await updateDoc(doc(db, 'batches', editingBatch.id), { ...batchData, status });
        setBatches(batches.map(b => 
          b.id === editingBatch.id ? { ...batchData, id: editingBatch.id, status } : b
        ));
      } else {
        const docRef = await addDoc(collection(db, 'batches'), { ...batchData, status });
        setBatches([...batches, { ...batchData, id: docRef.id, status }]);
      }
      
      setShowModal(false);
      setEditingBatch(null);
    } catch (error) {
      console.error('Error saving batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'batches', id));
        setBatches(batches.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting batch:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'low-stock': return 'bg-orange-100 text-orange-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.batches}</h1>
          <p className="text-gray-600">Track production batches and inventory</p>
        </div>
        <button
          onClick={() => { setEditingBatch(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          {t.addBatch}
        </button>
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

      {/* Low Stock Alerts */}
      {batches.some(b => b.status === 'low-stock') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-800">{t.lowStockAlert}</p>
            <p className="text-sm text-orange-600">
              {batches.filter(b => b.status === 'low-stock').length} batches need attention
            </p>
          </div>
        </motion.div>
      )}

      {/* Batches List */}
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
                    {t.batchNumber}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.productName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.shopName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.quantity}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.remaining}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.productionDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.expiryDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <motion.tr
                    key={batch.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{batch.batchNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.shopName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${batch.remaining < batch.quantity * 0.2 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {batch.remaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.productionDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.expiryDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
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
            {filteredBatches.map((batch) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{batch.batchNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {batch.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.productName}</span>
                    <span className="font-medium text-gray-900">{batch.productName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.shopName}</span>
                    <span className="text-gray-900">{batch.shopName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.quantity}</span>
                    <span className="text-gray-900">{batch.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.remaining}</span>
                    <span className={`font-medium ${batch.remaining < batch.quantity * 0.2 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {batch.remaining}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.productionDate}</span>
                    <span className="text-gray-900">{batch.productionDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.expiryDate}</span>
                    <span className="text-gray-900">{batch.expiryDate}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                    className="flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="flex-1 p-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4 text-purple-600" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showModal && (
        <BatchModal
          batch={editingBatch}
          products={products}
          shops={shops}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingBatch(null); }}
          t={t}
        />
      )}
    </div>
  );
}

function BatchModal({ 
  batch, 
  products,
  shops,
  onSave, 
  onClose, 
  t
}: { 
  batch: Batch | null;
  products: any[];
  shops: any[];
  onSave: (data: Omit<Batch, 'id' | 'status'>) => void;
  onClose: () => void;
  t: any;
}) {
  const [formData, setFormData] = useState({
    batchNumber: batch?.batchNumber || '',
    productId: batch?.productId || '',
    productName: batch?.productName || '',
    shopId: batch?.shopId || '',
    shopName: batch?.shopName || '',
    quantity: batch?.quantity || '',
    remaining: batch?.remaining || '',
    productionDate: batch?.productionDate || '',
    expiryDate: batch?.expiryDate || '',
    cost: batch?.cost || '',
    ingredientsUsed: batch?.ingredientsUsed || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      batchNumber: formData.batchNumber,
      productId: formData.productId,
      productName: formData.productName,
      shopId: formData.shopId,
      shopName: formData.shopName,
      quantity: Number(formData.quantity),
      remaining: Number(formData.remaining),
      productionDate: formData.productionDate,
      expiryDate: formData.expiryDate,
      cost: Number(formData.cost),
      ingredientsUsed: formData.ingredientsUsed,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {batch ? t.editBatch : t.addBatch}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.batchNumber}
            </label>
            <input
              type="text"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.productName}
            </label>
            <select
              value={formData.productId}
              onChange={(e) => {
                const selectedProduct = products.find(p => p.id === e.target.value);
                setFormData({
                  ...formData,
                  productId: e.target.value,
                  productName: selectedProduct?.name || '',
                  ingredientsUsed: selectedProduct?.ingredients?.map((ing: any) => ({
                    purchaseId: ing.purchaseId,
                    itemName: ing.itemName,
                    quantityUsed: ing.quantity,
                    unit: ing.unit,
                  })) || [],
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.shopName}
            </label>
            <select
              value={formData.shopId}
              onChange={(e) => {
                const selectedShop = shops.find(s => s.id === e.target.value);
                setFormData({
                  ...formData,
                  shopId: e.target.value,
                  shopName: selectedShop?.name || '',
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select shop</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.quantity}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.remaining}
              </label>
              <input
                type="number"
                value={formData.remaining}
                onChange={(e) => setFormData({ ...formData, remaining: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.productionDate}
              </label>
              <input
                type="date"
                value={formData.productionDate}
                onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.expiryDate}
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.cost}
            </label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          {formData.ingredientsUsed.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients Used (Inventory Deduction)
              </label>
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                {formData.ingredientsUsed.map((ingredient: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{ingredient.itemName}</span>
                    <span className="font-medium text-purple-700">
                      {ingredient.quantityUsed} {ingredient.unit}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-purple-200 text-xs text-gray-600">
                  These ingredients will be deducted from inventory when batch is created
                </div>
              </div>
            </div>
          )}
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
