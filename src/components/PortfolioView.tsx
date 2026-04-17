import { useState, useEffect, useCallback } from 'react';
import { fetchPortfolio, addTransaction, deleteTransaction } from '../services/api';
import type { PortfolioSummary, Transaction } from '../services/api';
import { AddTransactionModal } from './AddTransactionModal';
import './PortfolioView.css';

interface PortfolioViewProps {
  collectionId: string;
  collectionName: string;
}

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
}

export function PortfolioView({ collectionId }: PortfolioViewProps) {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [initialSymbol, setInitialSymbol] = useState('');
  const [initialType, setInitialType] = useState<'buy' | 'sell'>('buy');

  const load = useCallback(async () => {
    if (!collectionId) return;
    try {
      const data = await fetchPortfolio(collectionId);
      setPortfolio(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleAddTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    await addTransaction(tx);
    load();
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá giao dịch này?')) return;
    await deleteTransaction(id);
    load();
  };

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="portfolio-loading__spinner" />
        <p>Đang tải danh mục...</p>
      </div>
    );
  }

  const { holdings = [], totalValue = 0, totalCost = 0, totalPnL = 0, totalPnLPercent = 0 } = portfolio ?? {};
  const hasHoldings = holdings.length > 0;
  const isProfitable = totalPnL >= 0;

  return (
    <div className="portfolio">
      {/* Summary cards */}
      <div className="portfolio__summary">
        <div className="portfolio__card">
          <span className="portfolio__card-label">Tổng giá trị</span>
          <span className="portfolio__card-value">{fmt(totalValue)}đ</span>
        </div>
        <div className="portfolio__card">
          <span className="portfolio__card-label">Vốn đầu tư</span>
          <span className="portfolio__card-value">{fmt(totalCost)}đ</span>
        </div>
        <div className={`portfolio__card portfolio__card--pnl ${isProfitable ? 'positive' : 'negative'}`}>
          <span className="portfolio__card-label">Lãi / Lỗ</span>
          <span className="portfolio__card-value">
            {isProfitable ? '+' : ''}{fmt(totalPnL)}đ
          </span>
          <span className="portfolio__card-percent">
            ({isProfitable ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Holdings table */}
      <div className="portfolio__header-row">
        <h3 className="portfolio__section-title">Danh sách cổ phiếu nắm giữ</h3>
        <button className="portfolio__add-btn" onClick={() => setShowAddModal(true)}>
          + Thêm giao dịch
        </button>
      </div>

      {!hasHoldings ? (
        <div className="portfolio__empty">
          <span className="portfolio__empty-icon">📂</span>
          <p>Chưa có giao dịch nào trong danh mục này</p>
          <button className="portfolio__empty-btn" onClick={() => setShowAddModal(true)}>
            Thêm giao dịch đầu tiên
          </button>
        </div>
      ) : (
        <div className="portfolio__table-wrapper">
          <div className="portfolio__table-head">
            <span>Mã</span>
            <span>SL</span>
            <span>Giá TB</span>
            <span>Giá HT</span>
            <span>Giá trị</span>
            <span>Lãi/Lỗ</span>
            <span>%</span>
          </div>
          {holdings.map((h) => {
            const pos = h.pnl >= 0;
            const isExpanded = expandedSymbol === h.symbol;
            return (
              <div key={h.symbol} className="portfolio__holding-wrapper">
                <div
                  className={`portfolio__table-row ${isExpanded ? 'portfolio__table-row--expanded' : ''}`}
                  onClick={() => setExpandedSymbol(isExpanded ? null : h.symbol)}
                >
                  <span className="portfolio__symbol">
                    <span className="portfolio__badge">{h.symbol}</span>
                    <span className="portfolio__company">{h.companyName}</span>
                  </span>
                  <span>{fmt(h.quantity)}</span>
                  <span>{fmt(h.averageCost)}</span>
                  <span>{fmt(h.currentPrice)}</span>
                  <span>{fmt(h.currentValue)}</span>
                  <span className={pos ? 'text-positive' : 'text-negative'}>
                    {pos ? '+' : ''}{fmt(h.pnl)}
                  </span>
                  <span className={`portfolio__pnl-badge ${pos ? 'pos' : 'neg'}`}>
                    {pos ? '▲' : '▼'} {Math.abs(h.pnlPercent).toFixed(2)}%
                  </span>
                </div>

                {isExpanded && (
                  <div className="portfolio__txn-list">
                    <div className="portfolio__txn-head">
                      <span>Loại</span>
                      <span>Ngày GD</span>
                      <span>SL</span>
                      <span>Giá</span>
                      <span>Phí</span>
                      <span>Ghi chú</span>
                      <span className="text-right">Thao tác</span>
                    </div>
                    {h.transactions.map((t) => (
                      <div key={t.id} className={`portfolio__txn-row ${t.type}`}>
                        <span className={`portfolio__txn-type ${t.type}`}>
                          {t.type === 'buy' ? '🟢 Mua' : '🔴 Bán'}
                        </span>
                        <span>{t.traded_at}</span>
                        <span>{fmt(t.quantity)}</span>
                        <span>{fmt(t.price)}</span>
                        <span>{fmt(t.fee ?? 0)}</span>
                        <span className="portfolio__txn-note">{t.note || '—'}</span>
                        <span className="portfolio__txn-actions text-right">
                          <button 
                            className="portfolio__btn-delete-txn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (t.id) handleDeleteTransaction(t.id);
                            }}
                            title="Xóa giao dịch này"
                          >
                            ❌
                          </button>
                        </span>
                      </div>
                    ))}
                    
                    <div className="portfolio__txn-quick-actions">
                      <button 
                        className="btn-quick-trade buy"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInitialSymbol(h.symbol);
                          setInitialType('buy');
                          setShowAddModal(true);
                        }}
                      >
                        Mua
                      </button>
                      <button 
                        className="btn-quick-trade sell"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInitialSymbol(h.symbol);
                          setInitialType('sell');
                          setShowAddModal(true);
                        }}
                      >
                        Bán
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddTransactionModal
          collectionId={collectionId}
          initialSymbol={initialSymbol}
          initialType={initialType}
          onAdd={handleAddTransaction}
          onClose={() => {
            setShowAddModal(false);
            setInitialSymbol('');
            setInitialType('buy');
          }}
        />
      )}
    </div>
  );
}
