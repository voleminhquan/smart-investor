import { useState, useRef, useEffect } from 'react';
import { stockList } from '../data/mockData';
import './AddStockModal.css';

interface AddStockModalProps {
  existingSymbols: string[];
  onAdd: (symbol: string) => void;
  onClose: () => void;
}

export function AddStockModal({ existingSymbols, onAdd, onClose }: AddStockModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = stockList.filter(
    (s) =>
      !existingSymbols.includes(s.symbol) &&
      (s.symbol.toLowerCase().includes(query.toLowerCase()) ||
       s.companyName.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-stock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-stock-modal__header">
          <h3>Thêm mã cổ phiếu</h3>
          <button className="add-stock-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="add-stock-modal__search">
          <span className="add-stock-modal__search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm theo mã hoặc tên công ty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="add-stock-modal__list">
          {query.trim().length > 0 && !filtered.find(s => s.symbol.toUpperCase() === query.trim().toUpperCase()) && (
            <div 
              className="add-stock-modal__item custom-item"
              onClick={() => { onAdd(query.trim().toUpperCase()); onClose(); }}
            >
              <div className="add-stock-modal__item-left">
                <span className="add-stock-modal__badge">{query.trim().toUpperCase()}</span>
                <div className="add-stock-modal__item-info">
                  <span className="add-stock-modal__item-name">Thêm mã mới</span>
                </div>
              </div>
              <div className="add-stock-modal__item-right">
                <button className="add-stock-modal__add-btn">Thêm</button>
              </div>
            </div>
          )}

          {filtered.length === 0 && query.trim().length === 0 ? (
            <div className="add-stock-modal__empty">
              Nhập mã cổ phiếu (VD: FPT, VNM, TCB)
            </div>
          ) : (
            filtered.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="add-stock-modal__item"
                  onClick={() => { onAdd(stock.symbol); onClose(); }}
                >
                  <div className="add-stock-modal__item-left">
                    <span className="add-stock-modal__badge">{stock.symbol}</span>
                    <div className="add-stock-modal__item-info">
                      <span className="add-stock-modal__item-name">{stock.companyName}</span>
                      <span className="add-stock-modal__item-meta">
                        {stock.exchange} · {stock.industry}
                      </span>
                    </div>
                  </div>
                  <div className="add-stock-modal__item-right">
                    <span className="add-stock-modal__item-price">
                      {stock.price.toLocaleString('vi-VN')}
                    </span>
                    <span className={`add-stock-modal__item-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
