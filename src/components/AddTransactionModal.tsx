import { useState, useEffect, useRef } from 'react';
import type { Transaction } from '../services/api';
import './AddTransactionModal.css';

interface AddTransactionModalProps {
  collectionId: string;
  initialSymbol?: string;
  initialType?: 'buy' | 'sell';
  onAdd: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  onClose: () => void;
}

export function AddTransactionModal({ collectionId, initialSymbol, initialType, onAdd, onClose }: AddTransactionModalProps) {
  const [type, setType] = useState<'buy' | 'sell'>(initialType || 'buy');
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('');
  const [note, setNote] = useState('');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const totalValue = (Number(quantity) || 0) * (Number(price) || 0);
  const totalWithFee = type === 'buy' ? totalValue + (Number(fee) || 0) : totalValue - (Number(fee) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!symbol.trim()) { setError('Vui lòng nhập mã cổ phiếu'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('Số lượng phải lớn hơn 0'); return; }
    if (!price || Number(price) <= 0) { setError('Giá phải lớn hơn 0'); return; }
    if (!tradedAt) { setError('Vui lòng chọn ngày giao dịch'); return; }

    setLoading(true);
    try {
      await onAdd({
        collection_id: collectionId,
        symbol: symbol.trim().toUpperCase(),
        type,
        quantity: Number(quantity),
        price: Number(price),
        fee: Number(fee) || 0,
        note: note.trim() || undefined,
        traded_at: tradedAt,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-txn-modal" onClick={e => e.stopPropagation()}>
        <div className="add-txn-modal__header">
          <h3>Thêm giao dịch</h3>
          <button className="add-txn-modal__close" onClick={onClose}>×</button>
        </div>

        {/* Buy / Sell toggle */}
        <div className="add-txn-modal__type-toggle">
          <button
            className={`add-txn-modal__type-btn ${type === 'buy' ? 'active-buy' : ''}`}
            onClick={() => setType('buy')}
            type="button"
          >
            🟢 Mua
          </button>
          <button
            className={`add-txn-modal__type-btn ${type === 'sell' ? 'active-sell' : ''}`}
            onClick={() => setType('sell')}
            type="button"
          >
            🔴 Bán
          </button>
        </div>

        <form className="add-txn-modal__form" onSubmit={handleSubmit}>
          <div className="add-txn-modal__row">
            <div className="add-txn-modal__field">
              <label>Mã cổ phiếu</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="VD: FPT, VCB..."
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
            <div className="add-txn-modal__field">
              <label>Ngày giao dịch</label>
              <input
                type="date"
                value={tradedAt}
                onChange={e => setTradedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="add-txn-modal__row">
            <div className="add-txn-modal__field">
              <label>Số lượng (CP)</label>
              <input
                type="number"
                placeholder="1000"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="1"
                step="1"
              />
            </div>
            <div className="add-txn-modal__field">
              <label>Giá (đ/CP)</label>
              <input
                type="number"
                placeholder="80000"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min="0"
                step="any"
              />
            </div>
          </div>

          <div className="add-txn-modal__row">
            <div className="add-txn-modal__field">
              <label>Phí giao dịch (đ)</label>
              <input
                type="number"
                placeholder="0"
                value={fee}
                onChange={e => setFee(e.target.value)}
                min="0"
                step="any"
              />
            </div>
            <div className="add-txn-modal__field">
              <label>Ghi chú</label>
              <input
                type="text"
                placeholder="Tuỳ chọn..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          {totalValue > 0 && (
            <div className={`add-txn-modal__summary ${type}`}>
              <div className="add-txn-modal__summary-row">
                <span>Giá trị giao dịch</span>
                <span>{totalValue.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="add-txn-modal__summary-row total">
                <span>Tổng {type === 'buy' ? 'chi' : 'thu'}</span>
                <span>{totalWithFee.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          )}

          {error && <div className="add-txn-modal__error">{error}</div>}

          <button
            type="submit"
            className={`add-txn-modal__submit ${type}`}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : `${type === 'buy' ? '✅ Xác nhận mua' : '✅ Xác nhận bán'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
