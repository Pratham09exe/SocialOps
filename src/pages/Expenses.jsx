import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import {
  CreditCard,
  Plus,
  FileText,
  AlertCircle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function Expenses() {
  const { expenses, addExpense, clients } = useAppData();

  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('Software');
  const [clientAccount, setClientAccount] = useState('Agency Internal');
  const [amount, setAmount] = useState(5000);
  const [paymentMethod, setPaymentMethod] = useState('Corporate Card •• 4910');

  const categories = ['All Categories', 'Software', 'Contractor', 'Ad Spend', 'Travel', 'Office'];

  const filteredExpenses = expenses.filter((exp) => {
    if (activeCategory !== 'All Categories' && exp.category !== activeCategory) return false;
    return true;
  });

  const totalMonthly = expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  const adSpendTotal = expenses.filter(e => e.category === 'Ad Spend').reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  const softwareTotal = expenses.filter(e => e.category === 'Software').reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!description) return;

    await addExpense({
      description,
      details,
      category,
      clientAccount,
      paymentMethod,
      amount: Number(amount)
    });

    setDescription('');
    setDetails('');
    setIsExpenseModalOpen(false);
  };

  const getCategoryBadge = (cat = 'Software') => {
    switch (cat.toLowerCase()) {
      case 'software':
        return 'badge-primary';
      case 'ad spend':
        return 'badge-success';
      case 'contractor':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Agency Expenses & Media Spend"
        description="Pass-through ad spend, contractor fees, and creative SaaS tooling expenditures."
        badge={`${expenses.length} Records`}
        actions={
          <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary">
            <Plus size={15} />
            <span>Log Expense</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Monthly Expenses</span>
            <div className="kpi-icon-box">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{totalMonthly.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="kpi-subtitle">Current monthly operational burn</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Software & Creative Tools</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{softwareTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="kpi-subtitle">Figma, Adobe Creative Cloud, Midjourney</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pass-Through Ad Spend</span>
            <div className="kpi-icon-box" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{adSpendTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="kpi-subtitle">Direct client-reimbursed media campaigns</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bento-card" style={{ padding: '14px 18px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredExpenses.length}</strong> expenditure records
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="saas-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>CATEGORY</th>
                <th>CLIENT / ACCOUNT</th>
                <th>PAYMENT METHOD</th>
                <th>AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px' }}>
                    <EmptyState title="No expenses recorded" description="No entries found for this category." />
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id || idx}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exp.description}</div>
                      {exp.details && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exp.details}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getCategoryBadge(exp.category)}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {exp.clientAccount || 'Agency Internal'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        ₹{Number(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Log Operational Expenditure"
        subtitle="Track SaaS tools, freelance contractors, or media spend"
      >
        <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Expense Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Adobe Creative Cloud Team License"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="saas-input"
              >
                <option value="Software">Software</option>
                <option value="Contractor">Contractor</option>
                <option value="Ad Spend">Ad Spend</option>
                <option value="Travel">Travel</option>
                <option value="Office">Office</option>
              </select>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Allocated Client Account</label>
              <select
                value={clientAccount}
                onChange={(e) => setClientAccount(e.target.value)}
                className="saas-input"
              >
                <option value="Agency Internal">Agency Internal</option>
                {clients.map(c => (
                  <option key={c.id || c.account_id} value={c.name || c.business_name}>
                    {c.name || c.business_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Expenditure Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="saas-input"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="saas-input"
              >
                <option value="Corporate Card •• 4910">Corporate Card •• 4910</option>
                <option value="Bank Transfer / Wire">Bank Transfer / Wire</option>
                <option value="Petty Cash">Petty Cash</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
