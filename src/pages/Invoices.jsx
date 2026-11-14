import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Plus,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function Invoices() {
  const { invoices, createInvoice, recordPayment, clients, financeMetrics } = useAppData();
  const { activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState('All Invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Stripe ACH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // New Invoice form
  const [clientName, setClientName] = useState(clients[0]?.name || clients[0]?.business_name || '');
  const [amount, setAmount] = useState(15000);
  const [paymentMethod, setPaymentMethod] = useState('Bank Wire / NEFT');
  const [dueDate, setDueDate] = useState('2026-11-30');

  // Calculations
  const totalBilled = financeMetrics?.total_billed ? Number(financeMetrics.total_billed) : invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const outstanding = financeMetrics?.outstanding_receivables ? Number(financeMetrics.outstanding_receivables) : invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + (Number(i.balanceDue !== undefined ? i.balanceDue : i.amount) || 0), 0);
  const collected = financeMetrics?.total_collected ? Number(financeMetrics.total_collected) : invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    if (activeTab === 'All Invoices') return true;
    if (activeTab === 'Paid') return inv.status === 'Paid';
    if (activeTab === 'Pending') return inv.status === 'Pending';
    if (activeTab === 'Overdue') return inv.status === 'Overdue';
    return true;
  });

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!amount) return;

    await createInvoice({
      client: clientName,
      amount: Number(amount),
      paymentMethod,
      dueDate,
    });

    setIsInvoiceModalOpen(false);
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue !== undefined && inv.balanceDue > 0 ? inv.balanceDue : inv.amount);
    setPaymentMode(inv.paymentMethod || 'Bank Wire / NEFT');
    setPaymentRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;
    setPaymentError('');
    try {
      await recordPayment(selectedInvoice.dbId || selectedInvoice.id, {
        amount: Number(paymentAmount),
        paymentMethod: paymentMode,
        transactionReference: paymentRef
      });
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      setPaymentError(err.response?.data?.detail || err.message || 'Payment recording failed');
    }
  };

  const tabs = ['All Invoices', 'Pending', 'Overdue', 'Paid'];

  return (
    <div className="page-wrapper">
      <PageHeader
        title={activeRole === 'client' ? "Invoices & Payment History" : "Invoice Pipeline & Ledger"}
        description={
          activeRole === 'client'
            ? "Your account statements, payment history, and current billing balances."
            : "Monitor billing cycles, outstanding accounts receivable, and cash collections."
        }
        badge={`${invoices.length} Invoices`}
        actions={
          activeRole === 'admin' && (
            <button onClick={() => setIsInvoiceModalOpen(true)} className="btn-primary">
              <Plus size={15} />
              <span>Issue Invoice</span>
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Billed</span>
            <div className="kpi-icon-box">
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="kpi-subtitle">Total contracted invoice volume</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Outstanding Receivables</span>
            <div className="kpi-icon-box" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="kpi-subtitle">Open balance awaiting client collection</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Settled Collections</span>
            <div className="kpi-icon-box" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{collected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="kpi-subtitle">Confirmed wire & bank receipts</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const count = invoices.filter(i => tab === 'All Invoices' ? true : i.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'all var(--transition-fast)',
                  background: 'none'
                }}
              >
                <span>{tab}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="saas-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>INVOICE ID</th>
                <th>CLIENT ACCOUNT</th>
                <th>AMOUNT (₹)</th>
                <th>PAYMENT METHOD</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
                {activeRole === 'admin' && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={activeRole === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: '36px' }}>
                    <EmptyState title="No invoices found" description="No invoice records match this filter." />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id || inv.dbId}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.id || `INV-${inv.dbId}`}</span>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {inv.client || inv.client_name}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(inv.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {inv.balanceDue !== undefined && inv.balanceDue > 0 && inv.balanceDue < inv.amount && (
                        <div style={{ fontSize: '11px', color: 'var(--warning-text)' }}>
                          Bal: ₹{inv.balanceDue.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {inv.paymentMethod || 'Bank Wire'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{inv.dueDate || inv.due_date}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        inv.status === 'Paid' ? 'badge-success' :
                        inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    {activeRole === 'admin' && (
                      <td>
                        {inv.status !== 'Paid' ? (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11.5px' }}
                          >
                            Record Settlement
                          </button>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--success-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} />
                            Settled
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Issue Client Invoice"
        subtitle="Generate recurring retainer statement"
      >
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Client Account</label>
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="saas-input"
            >
              {clients.map(c => (
                <option key={c.id || c.account_id} value={c.name || c.business_name}>
                  {c.name || c.business_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Invoice Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="saas-input"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Settlement Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="saas-input"
              >
                <option value="Bank Wire / NEFT">Bank Wire / NEFT</option>
                <option value="UPI / Razorpay">UPI / Razorpay</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Stripe ACH">Stripe ACH</option>
              </select>
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Payment Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Record Payment Settlement"
          subtitle={`Settling Invoice ${selectedInvoice.id || selectedInvoice.dbId}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paymentError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-subtle)', color: 'var(--danger-text)', fontSize: '12px' }}>
                {paymentError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="saas-form-group">
                <label className="saas-label">Amount Settled (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="saas-input"
                />
              </div>

              <div className="saas-form-group">
                <label className="saas-label">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="saas-input"
                >
                  <option value="Bank Wire / NEFT">Bank Wire / NEFT</option>
                  <option value="UPI / Razorpay">UPI / Razorpay</option>
                  <option value="Corporate Card">Corporate Card</option>
                  <option value="Stripe ACH">Stripe ACH</option>
                </select>
              </div>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Transaction Reference Number</label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="saas-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Confirm Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
