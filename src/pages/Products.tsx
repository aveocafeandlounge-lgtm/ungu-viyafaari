import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  nameDv: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  image?: string;
  ingredients?: Array<{
    purchaseId: string;
    itemName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  recipeId?: string;
  costPrice?: number;
}

export default function Products() {
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load products, purchases, and recipes from Firebase
  useEffect(() => {
    loadProducts();
    loadPurchases();
    loadRecipes();
  }, []);

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'purchases'));
      const purchasesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'recipes'));
      const recipesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const categories = [
    { value: 'traditionalFood', label: t.traditionalFood },
    { value: 'hedhika', label: t.hedhika },
    { value: 'meals', label: t.meals },
    { value: 'drinks', label: t.drinks },
    { value: 'snacks', label: t.snacks },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.nameDv.includes(searchTerm)
  );

  const handleSave = async (productData: Omit<Product, 'id'>) => {
    setLoading(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setProducts(products.map(p => 
          p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
        ));
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        setProducts([...products, { ...productData, id: docRef.id }]);
      }
      
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'products', id));
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.products}</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          {t.addProduct}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'left-auto right-3' : ''}`} />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : ''}`}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-5 h-5" />
          {t.filter}
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.nameDv}</p>
                  </div>
                  <span className="text-lg font-bold text-purple-700">MVR {product.price}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t.stock}: {product.stock}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingProduct(product); setShowModal(true); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-purple-700" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          purchases={purchases}
          recipes={recipes}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          t={t}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

function ProductModal({ 
  product, 
  categories, 
  purchases,
  recipes,
  onSave, 
  onClose, 
  t,
  isRTL 
}: { 
  product: Product | null;
  categories: { value: string; label: string }[];
  purchases: any[];
  recipes: any[];
  onSave: (data: Omit<Product, 'id'>) => void;
  onClose: () => void;
  t: any;
  isRTL: boolean;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    nameDv: product?.nameDv || '',
    price: product?.price || '',
    description: product?.description || '',
    category: product?.category || '',
    stock: product?.stock || '',
    ingredients: product?.ingredients || [],
    recipeId: product?.recipeId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costPrice = formData.ingredients.reduce((sum: number, ing: any) => sum + (ing.cost || 0), 0);
    onSave({
      name: formData.name,
      nameDv: formData.nameDv,
      price: Number(formData.price),
      description: formData.description,
      category: formData.category,
      stock: Number(formData.stock),
      ingredients: formData.ingredients,
      recipeId: formData.recipeId,
      costPrice,
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
            {product ? t.editProduct : t.addProduct}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.productName}
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
              {t.productNameDv}
            </label>
            <input
              type="text"
              value={formData.nameDv}
              onChange={(e) => setFormData({ ...formData, nameDv: e.target.value })}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isRTL ? 'rtl' : ''}`}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.price}
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.stock}
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.category}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe (Optional)
            </label>
            <select
              value={formData.recipeId}
              onChange={(e) => {
                const selectedRecipe = recipes.find(r => r.id === e.target.value);
                setFormData({
                  ...formData,
                  recipeId: e.target.value,
                  ingredients: selectedRecipe?.ingredients || [],
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select recipe</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Ingredients
              </label>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  ingredients: [...formData.ingredients, { purchaseId: '', itemName: '', quantity: 0, unit: 'g', cost: 0 }],
                })}
                className="text-purple-700 text-sm font-medium hover:text-purple-800"
              >
                + Add Ingredient
              </button>
            </div>
            {formData.ingredients.map((ingredient: any, index: number) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <select
                  value={ingredient.purchaseId}
                  onChange={(e) => {
                    const selectedPurchase = purchases.find(p => p.id === e.target.value);
                    const updatedIngredients = [...formData.ingredients];
                    updatedIngredients[index] = {
                      ...ingredient,
                      purchaseId: e.target.value,
                      itemName: selectedPurchase?.itemName || '',
                      unit: selectedPurchase?.usableUnit || 'g',
                      cost: (selectedPurchase?.effectiveCostPerUnit || 0) * (ingredient.quantity || 0),
                    };
                    setFormData({ ...formData, ingredients: updatedIngredients });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="">Select ingredient</option>
                  {purchases.map((purchase) => (
                    <option key={purchase.id} value={purchase.id}>
                      {purchase.itemName} ({purchase.itemNameDv})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={ingredient.quantity || ''}
                  onChange={(e) => {
                    const selectedPurchase = purchases.find(p => p.id === ingredient.purchaseId);
                    const updatedIngredients = [...formData.ingredients];
                    updatedIngredients[index] = {
                      ...ingredient,
                      quantity: Number(e.target.value),
                      cost: (selectedPurchase?.effectiveCostPerUnit || 0) * Number(e.target.value),
                    };
                    setFormData({ ...formData, ingredients: updatedIngredients });
                  }}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <span className="text-sm text-gray-600">{ingredient.unit}</span>
                <span className="text-sm text-gray-600 w-20">MVR {(ingredient.cost || 0).toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    ingredients: formData.ingredients.filter((_, i) => i !== index),
                  })}
                  className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            ))}
            {formData.ingredients.length > 0 && (
              <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-semibold text-purple-700">
                    MVR {formData.ingredients.reduce((sum: number, ing: any) => sum + (ing.cost || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
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
