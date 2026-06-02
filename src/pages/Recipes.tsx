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
  Clock, 
  Users,
  Loader2,
  ChefHat,
  Calculator
} from 'lucide-react';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

interface Recipe {
  id: string;
  name: string;
  nameDv: string;
  category: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  servingSize: number;
}

export default function Recipes() {
  const { t, isRTL } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [batchCalculator, setBatchCalculator] = useState<{ recipeId: string; multiplier: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load recipes and purchases from Firebase
  useEffect(() => {
    loadRecipes();
    loadPurchases();
  }, []);

  const loadRecipes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'recipes'));
      const recipesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error loading recipes:', error);
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

  const categories = [
    { value: 'hedhika', label: t.hedhika },
    { value: 'meals', label: t.meals },
    { value: 'drinks', label: t.drinks },
    { value: 'snacks', label: t.snacks },
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.nameDv.includes(searchTerm)
  );

  const calculateTotalCost = (recipe: Recipe) => {
    return recipe.ingredients.reduce((total, ingredient) => total + ingredient.price, 0);
  };

  const calculateCostPerPortion = (recipe: Recipe) => {
    const totalCost = calculateTotalCost(recipe);
    return totalCost / recipe.servingSize;
  };

  const calculateBatchCost = (recipe: Recipe, batchMultiplier: number) => {
    const totalCost = calculateTotalCost(recipe);
    return totalCost * batchMultiplier;
  };

  const handleSave = async (recipeData: Omit<Recipe, 'id'>) => {
    setLoading(true);
    try {
      if (editingRecipe) {
        await updateDoc(doc(db, 'recipes', editingRecipe.id), recipeData);
        setRecipes(recipes.map(r => 
          r.id === editingRecipe.id ? { ...recipeData, id: editingRecipe.id } : r
        ));
      } else {
        const docRef = await addDoc(collection(db, 'recipes'), recipeData);
        setRecipes([...recipes, { ...recipeData, id: docRef.id }]);
      }
      
      setShowModal(false);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'recipes', id));
        setRecipes(recipes.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting recipe:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.recipes}</h1>
          <p className="text-gray-600">Store and manage traditional Maldivian recipes</p>
        </div>
        <button
          onClick={() => { setEditingRecipe(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          {t.addRecipe}
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

      {/* Recipes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-orange-300" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                    <p className="text-sm text-gray-600">{recipe.nameDv}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingRecipe(recipe); setShowModal(true); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-purple-700" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cookingTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servingSize} servings</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">{t.ingredients}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {recipe.ingredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ')}
                  </p>
                </div>

                <div className="mb-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold text-green-700">MVR {calculateTotalCost(recipe).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Cost/Portion:</span>
                    <span className="font-semibold text-green-700">MVR {calculateCostPerPortion(recipe).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setBatchCalculator({ recipeId: recipe.id, multiplier: 1 })}
                    className="mt-2 w-full text-xs text-green-600 hover:text-green-700 font-medium flex items-center justify-center gap-1"
                  >
                    <Calculator className="w-3 h-3" />
                    Calculate Batch Cost
                  </button>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                    {categories.find(c => c.value === recipe.category)?.label}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      {showModal && (
        <RecipeModal
          recipe={editingRecipe}
          categories={categories}
          purchases={purchases}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingRecipe(null); }}
          t={t}
          isRTL={isRTL}
        />
      )}

      {/* Batch Cost Calculator Modal */}
      {batchCalculator && (
        <BatchCostModal
          recipe={recipes.find(r => r.id === batchCalculator.recipeId)!}
          multiplier={batchCalculator.multiplier}
          onMultiplierChange={(multiplier) => setBatchCalculator({ ...batchCalculator, multiplier })}
          onClose={() => setBatchCalculator(null)}
          calculateBatchCost={calculateBatchCost}
        />
      )}
    </div>
  );
}

function RecipeModal({ 
  recipe, 
  categories, 
  purchases,
  onSave, 
  onClose, 
  t,
  isRTL 
}: { 
  recipe: Recipe | null;
  categories: { value: string; label: string }[];
  purchases: any[];
  onSave: (data: Omit<Recipe, 'id'>) => void;
  onClose: () => void;
  t: any;
  isRTL: boolean;
}) {
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    nameDv: recipe?.nameDv || '',
    category: recipe?.category || '',
    ingredients: recipe?.ingredients || [],
    steps: recipe?.steps.join('\n') || '',
    cookingTime: recipe?.cookingTime || '',
    servingSize: recipe?.servingSize || '',
  });

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: 0, unit: 'g', price: 0 }],
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      nameDv: formData.nameDv,
      category: formData.category,
      ingredients: formData.ingredients.filter(i => i.name),
      steps: formData.steps.split('\n').map(s => s.trim()).filter(s => s),
      cookingTime: Number(formData.cookingTime),
      servingSize: Number(formData.servingSize),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {recipe ? t.editRecipe : t.addRecipe}
          </h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.recipeName}
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
              {t.recipeNameDv}
            </label>
            <input
              type="text"
              value={formData.nameDv}
              onChange={(e) => setFormData({ ...formData, nameDv: e.target.value })}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isRTL ? 'rtl' : ''}`}
              required
            />
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t.ingredients}
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-purple-700 text-sm font-medium hover:text-purple-800"
              >
                + Add Ingredient
              </button>
            </div>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <select
                  value={ingredient.name}
                  onChange={(e) => {
                    const selectedPurchase = purchases.find(p => p.itemName === e.target.value);
                    if (selectedPurchase) {
                      updateIngredient(index, 'name', e.target.value);
                      updateIngredient(index, 'unit', selectedPurchase.usableUnit);
                      updateIngredient(index, 'price', selectedPurchase.effectiveCostPerUnit);
                    } else {
                      updateIngredient(index, 'name', e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Select ingredient</option>
                  {purchases.map((purchase) => (
                    <option key={purchase.id} value={purchase.itemName}>
                      {purchase.itemName} ({purchase.itemNameDv})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={ingredient.quantity || ''}
                  onChange={(e) => updateIngredient(index, 'quantity', Number(e.target.value))}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <select
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="pc">pc</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={ingredient.price || ''}
                  onChange={(e) => updateIngredient(index, 'price', Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.steps}
            </label>
            <textarea
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              rows={4}
              placeholder="Enter each step on a new line"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.cookingTime} (min)
              </label>
              <input
                type="number"
                value={formData.cookingTime}
                onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.servingSize}
              </label>
              <input
                type="number"
                value={formData.servingSize}
                onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
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
        </div>
      </motion.div>
    </div>
  );
}

function BatchCostModal({ 
  recipe, 
  multiplier, 
  onMultiplierChange, 
  onClose, 
  calculateBatchCost 
}: { 
  recipe: Recipe;
  multiplier: number;
  onMultiplierChange: (multiplier: number) => void;
  onClose: () => void;
  calculateBatchCost: (recipe: Recipe, multiplier: number) => number;
}) {
  const batchCost = calculateBatchCost(recipe, multiplier);
  const totalPortions = recipe.servingSize * multiplier;
  const costPerPortion = batchCost / totalPortions;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-700" />
            Batch Cost Calculator
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe
            </label>
            <p className="text-lg font-semibold text-gray-800">{recipe.name}</p>
            <p className="text-sm text-gray-600">{recipe.nameDv}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Multiplier (x{recipe.servingSize} servings per batch)
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={multiplier}
              onChange={(e) => onMultiplierChange(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Base Recipe Cost:</span>
              <span className="font-semibold text-gray-800">
                MVR {recipe.ingredients.reduce((total, i) => total + i.price, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Batch Cost:</span>
              <span className="font-bold text-green-700 text-lg">
                MVR {batchCost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Portions:</span>
              <span className="font-semibold text-gray-800">{totalPortions}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-green-200">
              <span className="text-gray-600">Cost per Portion:</span>
              <span className="font-bold text-green-700">
                MVR {costPerPortion.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
