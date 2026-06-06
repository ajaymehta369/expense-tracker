import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, trendsRes, insightsRes] = await Promise.all([
        dashboardService.getDashboard({ month: selectedMonth, year: selectedYear }),
        dashboardService.getTrends({ months: 6 }),
        dashboardService.getInsights({ month: selectedMonth, year: selectedYear }),
      ]);
      setData(dashboardRes.data);
      setTrends(trendsRes.data.trends);
      setInsights(insightsRes.data.insights);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Month/Year selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Track your spending at a glance</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.summary?.total_spent || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.summary?.total_budget || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${
                (data?.summary?.remaining_budget || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data?.summary?.remaining_budget || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.summary?.expense_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>
          
          <div className="card lg:col-span-4 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Single Expense (This Month)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data?.summary?.highest_expense || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>
              }`}
            >
              <p className="font-medium">{insight.title}</p>
              <p className="text-sm text-gray-600">{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          {data?.spending_by_category?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.spending_by_category}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category_name, percentage }) => `${category_name} (${percentage}%)`}
                  >
                    {data.spending_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data for this period
            </div>
          )}
        </div>

        {/* Monthly Trends - Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          {trends.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month_name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total_spent" fill="#0ea5e9" name="Spent" />
                  <Bar dataKey="total_budget" fill="#22c55e" name="Budget" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Budget Status */}
      {data?.budget_status?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Budget Status</h3>
          <div className="space-y-4">
            {data.budget_status.map((budget) => (
              <div key={budget.category_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{budget.icon}</span>
                    <span className="font-medium">{budget.category_name}</span>
                  </div>
                  <span className={`text-sm ${budget.over_budget ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budget.over_budget ? 'bg-red-500' : 
                      budget.percentage_used > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Expenses</h3>
          <Link to="/expenses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        {data?.recent_expenses?.length > 0 ? (
          <div className="divide-y">
            {data.recent_expenses.map((expense) => (
              <div key={expense.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${expense.category?.color}20` }}
                  >
                    <span>{expense.category?.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-gray-500">
                      {expense.category?.name} • {format(new Date(expense.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent expenses</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
