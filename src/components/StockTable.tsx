import './StockTable.css';

interface StockTableProps {
  symbols: string[];
  activeSymbol: string;
  stockDetails: Record<string, any>; // Passed from App.tsx
  syncingSymbols?: Set<string>;
  onSelectStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onAddStock: () => void;
}

export function StockTable({
  symbols,
  activeSymbol,
  stockDetails,
  syncingSymbols = new Set(),
  onSelectStock,
  onRemoveStock,
  onAddStock,
}: StockTableProps) {
  return (
    <div className="stock-table">
      <div className="stock-table__header">
        <span className="stock-table__col stock-table__col--symbol">Mã</span>
        <span className="stock-table__col stock-table__col--name">Tên</span>
        <span className="stock-table__col stock-table__col--price">Giá</span>
        <span className="stock-table__col stock-table__col--change">Thay đổi</span>
        <span className="stock-table__col stock-table__col--action"></span>
      </div>
      <div className="stock-table__body">
        {symbols.length === 0 ? (
          <div className="stock-table__empty">
            <span className="stock-table__empty-icon">📋</span>
            <p>Chưa có mã nào trong danh mục</p>
            <button className="stock-table__empty-btn" onClick={onAddStock}>
              + Thêm mã cổ phiếu
            </button>
          </div>
        ) : (
          symbols.map((sym, i) => {
            const isSyncing = syncingSymbols.has(sym);
            const stock = stockDetails[sym];
            
            if (!stock || stock.price === 0 || isSyncing) return (
              <div key={sym} className="stock-table__row" style={{ opacity: 0.6 }}>
                <span className="stock-table__col stock-table__col--symbol">
                  <span className="stock-table__symbol-badge">{sym}</span>
                </span>
                <span className="stock-table__col stock-table__col--name text-muted">
                  {isSyncing ? "Đang đồng bộ..." : "Đang tải dữ liệu..."}
                </span>
                <span className="stock-table__col stock-table__col--price">--</span>
                <span className="stock-table__col stock-table__col--change">--</span>
                <span className="stock-table__col stock-table__col--action">
                  <button className="stock-table__remove-btn" onClick={(e) => { e.stopPropagation(); onRemoveStock(sym); }}>×</button>
                </span>
              </div>
            );
            
            const isPositive = stock.change >= 0;
            const displayPrice = (stock.price / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const displayChange = (Math.abs(stock.change) / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            return (
              <div
                key={sym}
                className={`stock-table__row ${activeSymbol === sym ? 'stock-table__row--active' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => onSelectStock(sym)}
              >
                <span className="stock-table__col stock-table__col--symbol">
                  <span className="stock-table__symbol-badge">{sym}</span>
                </span>
                <span className="stock-table__col stock-table__col--name">
                  {stock.companyName}
                </span>
                <span className="stock-table__col stock-table__col--price">
                  {displayPrice}
                </span>
                <span
                  className={`stock-table__col stock-table__col--change ${
                    isPositive ? 'stock-table__col--positive' : 'stock-table__col--negative'
                  }`}
                >
                  {isPositive ? '+' : '-'}{displayChange} • {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
                <span className="stock-table__col stock-table__col--action">
                  <button
                    className="stock-table__remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStock(sym);
                    }}
                    title="Xóa khỏi danh mục"
                  >
                    ×
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
      {symbols.length > 0 && (
        <button className="stock-table__add-row" onClick={onAddStock}>
          + Thêm mã cổ phiếu
        </button>
      )}
    </div>
  );
}
