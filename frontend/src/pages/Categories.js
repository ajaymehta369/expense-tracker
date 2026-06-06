import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/api';
import toast from 'react-hot-toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    color: '#6b7280',
  });
  const [saving, setSaving] = useState(false);

  // Available icons
  const icons = ['🍔', '🚗', '🛍️', '🎬', '💡', '🏥', '📚', '📦', '✈️', '🏠', '💳', '🎮', '🎁', '💼', '🌿', '🐕'];
  
  // Available colors
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#6b7280', '#1f2937'
  ];

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        icon: '📦',
        color: '#6b7280',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: '📦',
      color: '#6b7280',
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoryService.create(formData);
        toast.success('Category created successfully');
      }
      
      closeModal();
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save category';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const category = categories.find(c => c.id === id);
    
    if (category?.is_default) {
      toast.error('Cannot delete default categories');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category? Expenses in this category will need to be reassigned.')) {
      return;
    }

    try {
      await categoryService.delete(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete category';
      if (error.response?.data?.expense_count) {
        toast.error(`Cannot delete: ${error.response.data.expense_count} expenses are using this category`);
      } else {
        toast.error(message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your expenses into categories</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          + Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(category => (
          <div key={category.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{category.name}</p>
                  {category.is_default && (
                    <span className="text-xs text-gray-500">Default</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(category)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                {!category.is_default && (
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-500">{category.color}</span>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="card text-center py-12">
          <span className="text-4xl">📁</span>
          <p className="mt-4 text-gray-600">No categories yet</p>
          <button onClick={() => openModal()} className="mt-4 btn btn-primary">
            Create your first category
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Category name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                        formData.icon === icon 
                          ? 'bg-primary-100 ring-2 ring-primary-500' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    <span className="text-2xl">{formData.icon}</span>
                  </div>
                  <span className="font-medium">{formData.name || 'Category Name'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn btn-primary"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
