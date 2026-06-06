import React, { useState, useEffect, useCallback } from 'react';
import { budgetService, categoryService } from '../services/api';
import toast from 'react-hot-toast';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
  });
  const [saving, setSaving] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await budgetService.getAll({ 
        month: selectedMonth, 
        year: selectedYear 
      });
      setBudgets(response.data.budgets);
    } catch (error) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const openModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        amount: budget.amount.toString(),
        category_id: budget.category_id.toString(),
      });
    } else {
      setEditingBudget(null);
      // Find categories without budgets for this period
      const existingCategoryIds = budgets.map(b => b.category_id);
      const availableCategories = categories.filter(c => !existingCategoryIds.includes(c.id));
      
      setFormData({
        amount: '',
        category_id: availableCategories[0]?.id?.toString() || '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setFormData({
      amount: '',
      category_id: '',
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        month: selectedMonth,
        year: selectedYear,
      };

      if (editingBudget) {
        await budgetService.update(editingBudget.id, { amount: data.amount });
        toast.success('Budget updated successfully');
      } else {
        await budgetService.create(data);
        toast.success('Budget created successfully');
      }
      
      closeModal();
      fetchBudgets();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save budget';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await budgetService.delete(id);
      toast.success('Budget deleted successfully');
      fetchBudgets();
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  const handleCopyBudgets = async () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    
    if (!window.confirm(`Copy budgets from ${months[prevMonth - 1]} ${prevYear}?`)) {
      return;
    }

    try {
      const response = await budgetService.copy({
        from_month: prevMonth,
        from_year: prevYear,
        to_month: selectedMonth,
        to_year: selectedYear,
      });
      toast.success(response.data.message);
      fetchBudgets();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to copy budgets';
      toast.error(message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  // Get available categories for new budget
  const existingCategoryIds = budgets.map(b => b.category_id);
  const availableCategories = categories.filter(c => !existingCategoryIds.includes(c.id));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Set spending limits for each category</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleCopyBudgets}
            className="btn btn-secondary"
            title="Copy budgets from previous month"
          >
            📋 Copy from Last Month
          </button>
          <button 
            onClick={() => openModal()} 
            className="btn btn-primary"
            disabled={availableCategories.length === 0}
          >
            + Add Budget
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card">
        <div className="flex items-center gap-4">
          <label className="font-medium">Period:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Remaining</p>
          <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>
      </div>

      {/* Budgets List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">🎯</span>
          <p className="mt-4 text-gray-600">No budgets set for {months[selectedMonth - 1]} {selectedYear}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={handleCopyBudgets} className="btn btn-secondary">
              Copy from Last Month
            </button>
            <button onClick={() => openModal()} className="btn btn-primary">
              Create Budget
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(budget => (
            <div key={budget.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${budget.category?.color}20` }}
                  >
                    <span className="text-2xl">{budget.category?.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{budget.category?.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)} spent
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-semibold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budget.remaining >= 0 ? formatCurrency(budget.remaining) + ' left' : formatCurrency(Math.abs(budget.remaining)) + ' over'}
                    </p>
                    <p className="text-sm text-gray-500">{budget.percentage_used}% used</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(budget)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budget.percentage_used > 100 ? 'bg-red-500' :
                    budget.percentage_used > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingBudget ? 'Edit Budget' : 'Add Budget'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {months[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingBudget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    required
                    disabled={editingBudget}
                  >
                    <option value="">Select a category</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  {availableCategories.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      All categories already have budgets for this period
                    </p>
                  )}
                </div>
              )}
              
              {editingBudget && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${editingBudget.category?.color}20` }}
                  >
                    <span className="text-xl">{editingBudget.category?.icon}</span>
                  </div>
                  <span className="font-medium">{editingBudget.category?.name}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
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
                  disabled={saving || (!editingBudget && availableCategories.length === 0)}
                  className="flex-1 btn btn-primary"
                >
                  {saving ? 'Saving...' : editingBudget ? 'Update' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
