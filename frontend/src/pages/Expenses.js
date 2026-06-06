import React, { useState, useEffect, useCallback } from 'react';
import { expenseService, categoryService } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category_id: '',
    start_date: '',
    end_date: '',
  });
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  }, []);

  const fetchExpenses = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = { page: pageNum, per_page: 20, ...filters };
      // Remove empty filters
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await expenseService.getAll(params);
      const { expenses: newExpenses, total: totalCount, has_next } = response.data;
      
      if (append) {
        setExpenses(prev => [...prev, ...newExpenses]);
      } else {
        setExpenses(newExpenses);
      }
      setTotal(totalCount);
      setHasMore(has_next);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
    fetchExpenses(1, false);
  }, [filters, fetchExpenses]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ category_id: '', start_date: '', end_date: '' });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExpenses(nextPage, true);
  };

  const openModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        amount: expense.amount.toString(),
        description: expense.description,
        date: expense.date,
        category_id: expense.category_id.toString(),
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category_id: categories[0]?.id?.toString() || '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category_id: '',
      notes: '',
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
      };

      if (editingExpense) {
        await expenseService.update(editingExpense.id, data);
        toast.success('Expense updated successfully');
      } else {
        await expenseService.create(data);
        toast.success('Expense added successfully');
      }
      
      closeModal();
      fetchExpenses(1, false);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save expense';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.delete(id);
      toast.success('Expense deleted successfully');
      fetchExpenses(1, false);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">{total} expense{total !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              className="w-full"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex items-end">
            <button onClick={clearFilters} className="btn btn-secondary w-full">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="card">
        {loading && expenses.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">💸</span>
            <p className="mt-4 text-gray-600">No expenses found</p>
            <button onClick={() => openModal()} className="mt-4 btn btn-primary">
              Add your first expense
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {expenses.map(expense => (
                <div key={expense.id} className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-6 px-6 transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${expense.category?.color}20` }}
                    >
                      <span className="text-xl">{expense.category?.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.category?.name} • {format(new Date(expense.date), 'MMM d, yyyy')}
                      </p>
                      {expense.notes && (
                        <p className="text-sm text-gray-400 mt-1">{expense.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-red-600 text-lg">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(expense)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="What did you spend on?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                  disabled={saving}
                  className="flex-1 btn btn-primary"
                >
                  {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
