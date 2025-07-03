import { useState, useEffect } from 'react';
import { mealsAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, Zap } from 'lucide-react';

const ManageMealsPage = () => {
  const [meals, setMeals] = useState([]);
  // State for form data
  const [formData, setFormData] = useState({
    date: '',
    mealType: 'breakfast',
    price: '',
    isVegetarian: false,
    maxCapacity: 100,
    description: '',
    items: [{ name: '', quantity: '1 serving', calories: 0, category: 'main' }],
  });

  // State for weekly meals
  const [weeklyMeals, setWeeklyMeals] = useState({});

  // Fetch meals and group by week
  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      // Filter meals by selected mealType if needed in future
      const res = await mealsAPI.getAll();
      setMeals(res.data.meals || []);
      // Group meals by week (ISO week)
      const grouped = {};
      (res.data.meals || []).forEach(meal => {
        const date = new Date(meal.date);
        // Get ISO week string: "YYYY-Www"
        const week = `${date.getFullYear()}-W${String(getISOWeek(date)).padStart(2, '0')}`;
        if (!grouped[week]) grouped[week] = [];
        grouped[week].push(meal);
      });
      setWeeklyMeals(grouped);
    } catch (error) {
      toast.error('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get ISO week number
  function getISOWeek(date) {
    const tmp = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    tmp.setDate(tmp.getDate() - dayNr + 3);
    const firstThursday = tmp.valueOf();
    tmp.setMonth(0, 1);
    if (tmp.getDay() !== 4) {
      tmp.setMonth(0, 1 + ((4 - tmp.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - tmp) / 604800000);
  }
  const [isEditing, setIsEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // (Removed duplicate fetchMeals and useEffect)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[idx][name] = name === 'calories' ? Number(value) : value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: '1 serving', calories: 0, category: 'main' }],
    });
  };

  const removeItem = (idx) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const handleAiEstimate = async (idx) => {
    const item = formData.items[idx];
    if (!item.name) {
      toast.error('Please enter an item name first.');
      return;
    }
    try {
      setAiLoading(true);
      const res = await aiAPI.estimateCalories(item.name);
      const newItems = [...formData.items];
      newItems[idx].calories = res.data.calories;
      setFormData({ ...formData, items: newItems });
      toast.success('Calories estimated!');
    } catch (error) {
      toast.error('Failed to estimate calories');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        maxCapacity: Number(formData.maxCapacity),
        items: formData.items.map(i => ({
          ...i,
          calories: Number(i.calories),
        })),
      };
      if (isEditing) {
        await mealsAPI.update(isEditing, payload);
        toast.success('Meal updated successfully!');
      } else {
        await mealsAPI.create(payload);
        toast.success('Meal created successfully!');
      }
      resetForm();
      fetchMeals();
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} meal`);
      console.error('Meal create/update error:', error.response?.data || error.message);
    }
  };

  const handleEdit = (meal) => {
    setIsEditing(meal._id);
    setFormData({
      date: new Date(meal.date).toISOString().split('T')[0],
      mealType: meal.mealType,
      price: meal.price,
      isVegetarian: meal.isVegetarian,
      maxCapacity: meal.maxCapacity,
      description: meal.description,
      items: meal.items && meal.items.length > 0 ? meal.items : [{ name: '', quantity: '1 serving', calories: 0, category: 'main' }],
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await mealsAPI.delete(id);
        toast.success('Meal deleted successfully!');
        fetchMeals();
      } catch (error) {
        toast.error('Failed to delete meal');
      }
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({
      date: '',
      mealType: 'breakfast',
      price: '',
      isVegetarian: false,
      maxCapacity: 100,
      description: '',
      items: [{ name: '', quantity: '1 serving', calories: 0, category: 'main' }],
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Manage Meals</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{isEditing ? 'Edit Meal' : 'Create Meal'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
              </div>
              <div>
                <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Meal Type</label>
                <select name="mealType" id="mealType" value={formData.mealType} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Meal Items</label>
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <input type="text" name="name" placeholder="Item name" value={item.name} onChange={e => handleItemChange(idx, e)} className="w-1/4 border rounded px-2 py-1 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
                    <input type="text" name="quantity" placeholder="Quantity" value={item.quantity} onChange={e => handleItemChange(idx, e)} className="w-1/4 border rounded px-2 py-1 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <input type="number" name="calories" placeholder="Calories" value={item.calories} onChange={e => handleItemChange(idx, e)} className="w-1/4 border rounded px-2 py-1 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <select name="category" value={item.category} onChange={e => handleItemChange(idx, e)} className="w-1/4 border rounded px-2 py-1 bg-background dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="main">Main</option>
                      <option value="side">Side</option>
                      <option value="dessert">Dessert</option>
                      <option value="beverage">Beverage</option>
                    </select>
                    <button type="button" onClick={() => handleAiEstimate(idx)} className="text-yellow-500 hover:text-yellow-600"><Zap className="w-5 h-5" /></button>
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-blue-600 hover:underline mt-1">+ Add Item</button>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Price (₹)</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
              </div>
              <div>
                <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Max Capacity</label>
                <input type="number" name="maxCapacity" id="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="isVegetarian" id="isVegetarian" checked={formData.isVegetarian} onChange={handleInputChange} />
                <label htmlFor="isVegetarian" className="text-sm font-medium text-gray-700 dark:text-gray-200">Vegetarian</label>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white"></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                {isEditing && <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>}
                <button type="submit" className="btn-primary"><Plus className="w-4 h-4 mr-2" />{isEditing ? 'Update Meal' : 'Add Meal'}</button>
              </div>
            </form>
          </div>
        </div>

        {/* Meal List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
                  ) : (
                    meals.map((meal) => (
                      <tr key={meal._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meal.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(meal.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{meal.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{meal.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => handleEdit(meal)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5"/></button>
                          <button onClick={() => handleDelete(meal._id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageMealsPage; 