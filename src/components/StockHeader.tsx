import './StockHeader.css';
import type { StockData } from '../data/mockData';

interface StockHeaderProps {
  stock: StockData;
}

export function StockHeader({ stock }: StockHeaderProps) {
  const isPositive = stock.change >= 0;
  
  // Format price and change divided by 1000 like regular stock boards
  const displayPrice = (stock.price / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayChange = (Math.abs(stock.change) / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="stock-header">
      <div className="stock-header__top">
        <div className="stock-header__symbol-group">
          <div className="stock-header__icon">
            {stock.symbol.charAt(0)}
          </div>
          <div>
            <h1 className="stock-header__symbol">{stock.symbol}</h1>
            <p className="stock-header__company">{stock.companyName}</p>
          </div>
        </div>
      </div>
      <div className="stock-header__price-row">
        <span className="stock-header__price">
          {displayPrice}
        </span>
        <div className={`stock-header__change ${isPositive ? 'stock-header__change--positive' : 'stock-header__change--negative'}`}>
          <span className="stock-header__change-icon">
            {isPositive ? '▲' : '▼'}
          </span>
          <span className="stock-header__change-value">
            {isPositive ? '+' : '-'}{displayChange}
          </span>
          <span className="stock-header__change-percent">
            ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
