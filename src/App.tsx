import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { NavigationTabs } from './components/NavigationTabs';
import { StockHeader } from './components/StockHeader';
import { IndicatorSection } from './components/IndicatorSection';
import { StockTable } from './components/StockTable';
import { AddStockModal } from './components/AddStockModal';
import { CandlestickChart } from './components/CandlestickChart';
import { FundamentalAnalysis } from './components/FundamentalAnalysis';
import { SettingsModal } from './components/SettingsModal';
import { PortfolioView } from './components/PortfolioView';
import { tabs } from './data/mockData';
import { 
  fetchCollections, createCollection, deleteCollection, 
  addStockToCollection, removeStockFromCollection,
  fetchCompanyDetails, triggerSync, fetchCompanies
} from './services/api';
import type { Collection } from './services/api';
import './App.css';

function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('');
  const [activeSymbol, setActiveSymbol] = useState<string>('');
  const [activeStock, setActiveStock] = useState<any>(null);
  
  const [activeView, setActiveView] = useState<'watchlist' | 'portfolio'>('watchlist');
  const [activeTab, setActiveTab] = useState('indicators');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [stockDetails, setStockDetails] = useState<Record<string, any>>({});
  const initialLoadDone = useRef(false);

  // Load collections and companies
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [collectionsData, companiesData] = await Promise.all([
          fetchCollections(),
          fetchCompanies()
        ]);
        
        if (!isMounted) return;

        setCollections(collectionsData);
        
        // Only set initial selection on the very first load
        if (!initialLoadDone.current && collectionsData.length > 0) {
          initialLoadDone.current = true;
          setActiveCollectionId(collectionsData[0].id);
          if (collectionsData[0].symbols.length > 0) {
            setActiveSymbol(collectionsData[0].symbols[0]);
          }
        }

        const detailsMap: Record<string, any> = {};
        for(const c of companiesData as any[]) {
          detailsMap[c.symbol] = c;
        }
        setStockDetails(detailsMap);

        setIsLoading(false);
      } catch(err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    
    // Initial load
    loadData();

    // Poll every 10 seconds for updates (useful after a background sync is started)
    const interval = setInterval(loadData, 10000);

    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, []);

  // Load active stock details
  useEffect(() => {
    if (!activeSymbol) {
      setActiveStock(null);
      return;
    }
    
    // In a real app we'd fetch full stock info and indicators here
    fetchCompanyDetails(activeSymbol)
      .then(company => {
        const details = stockDetails[company.symbol] || {};
        // We structure it like the mock data for now
        setActiveStock({
          symbol: company.symbol,
          companyName: company.company_name || company.symbol,
          price: details.price || 0,
          change: details.change || 0,
          changePercent: details.changePercent || 0,
          sections: [] // We could fetch financial ratios here
        });
      })
      .catch(err => console.error(err));
  }, [activeSymbol, stockDetails]);

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  // When selecting a collection, auto-select first stock
  const handleSelectCollection = useCallback((id: string) => {
    setActiveCollectionId(id);
    const col = collections.find((c) => c.id === id);
    setActiveSymbol(col?.symbols[0] ?? '');
  }, [collections]);

  const handleCreateCollection = async (name: string, icon: string) => {
    try {
      const newCol = await createCollection(name, icon);
      setCollections(prev => [...prev, newCol]);
      setActiveCollectionId(newCol.id);
      setActiveSymbol('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      const updated = collections.filter((c) => c.id !== id);
      setCollections(updated);
      if (activeCollectionId === id && updated.length > 0) {
        setActiveCollectionId(updated[0].id);
        setActiveSymbol(updated[0].symbols[0] ?? '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [syncingSymbols, setSyncingSymbols] = useState<Set<string>>(new Set());

  const handleAddStock = async (symbol: string) => {
    if (!activeCollectionId) return;
    try {
      await addStockToCollection(activeCollectionId, symbol);
      
      // Update local state
      setCollections(prev => prev.map((c) => {
        if (c.id === activeCollectionId && !c.symbols.includes(symbol)) {
          return { ...c, symbols: [...c.symbols, symbol] };
        }
        return c;
      }));
      setActiveSymbol(symbol);
      
      // Mark as syncing
      setSyncingSymbols(prev => new Set(prev).add(symbol));

      // Kick off background sync for the new stock
      triggerSync(symbol)
        .then(() => {
          console.log(`Sync started for ${symbol}`);
        })
        .catch(console.error)
        .finally(() => {
          // Keep the syncing spinner for a bit while long polling catches up
          setTimeout(() => {
            setSyncingSymbols(prev => {
              const next = new Set(prev);
              next.delete(symbol);
              return next;
            });
          }, 5000);
        });
    } catch (err) {
      console.error(err);
      alert('Không thể thêm mã này. ' + (err as Error).message);
    }
  };

  const handleRemoveStock = async (symbol: string) => {
    try {
      if (!activeCollectionId) return;
      await removeStockFromCollection(activeCollectionId, symbol);
      
      const updated = collections.map((c) => {
        if (c.id === activeCollectionId) {
          return { ...c, symbols: c.symbols.filter((s) => s !== symbol) };
        }
        return c;
      });
      setCollections(updated);
      
      if (activeSymbol === symbol) {
        const col = updated.find((c) => c.id === activeCollectionId);
        setActiveSymbol(col?.symbols[0] ?? '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToList = () => {
    setActiveSymbol('');
  };

  if (isLoading) {
    return <div className="app-loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={handleSelectCollection}
        onCreateCollection={handleCreateCollection}
        onDeleteCollection={handleDeleteCollection}
        onOpenSettings={() => { setShowSettings(true); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      <div className="app-main">
        {/* Mobile header bar */}
        <div className="app-main__mobile-header">
          <button
            className="app-main__hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h2 className="app-main__mobile-title">
            {activeView === 'portfolio' ? '💼 Hiệu quả đầu tư (Tổng hợp)' : activeStock
              ? activeStock.symbol
              : `${activeCollection?.icon ?? ''} ${activeCollection?.name ?? 'Smart Investor'}`
            }
          </h2>
          <button
            className="app-main__settings-btn"
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </button>
        </div>

        {/* Desktop collection header */}
        <div className="app-main__collection-header">
          <h2 className="app-main__collection-title">
            {activeView === 'portfolio' ? '💼 Hiệu quả đầu tư (Tổng hợp)' : `${activeCollection?.icon ?? ''} ${activeCollection?.name ?? 'Danh mục'}`}
          </h2>
        </div>

        <div className={`app-main__content ${activeView === 'portfolio' ? 'app-main__content--portfolio' : ''}`}>
          {activeView === 'portfolio' ? (
            <div className="app-main__list-pane" style={{ borderRight: 'none' }}>
              <PortfolioView 
                collectionId="all" 
                collectionName="Danh mục đầu tư Tổng hợp" 
              />
            </div>
          ) : (
            <>
              {/* Mobile: show either collection content OR detail, not both */}
              <div className={`app-main__list-pane ${activeSymbol ? 'app-main__list-pane--hidden-mobile' : ''}`}>
                <StockTable
                  symbols={activeCollection?.symbols ?? []}
                  activeSymbol={activeSymbol}
                  stockDetails={stockDetails}
                  syncingSymbols={syncingSymbols}
                  onSelectStock={setActiveSymbol}
                  onRemoveStock={handleRemoveStock}
                  onAddStock={() => setShowAddModal(true)}
                />
              </div>

              {/* Stock detail panel */}
              {activeStock && (
            <div className="stock-detail" key={activeSymbol}>
              <button className="stock-detail__back" onClick={handleBackToList}>
                ← Quay lại danh mục
              </button>
              <StockHeader stock={activeStock} />
              <NavigationTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <div className="stock-detail__body">
                {activeTab === 'indicators' ? (
                  <div className="indicators-grid">
                    {activeStock.sections?.map((section: any, index: number) => (
                      <IndicatorSection
                        key={section.id || index}
                        section={section}
                        sectionIndex={index}
                      />
                    ))}
                  </div>
                ) : activeTab === 'technical' ? (
                  <CandlestickChart symbol={activeSymbol} />
                ) : activeTab === 'financials' ? (
                  <FundamentalAnalysis symbol={activeSymbol} />
                ) : (
                  <div className="placeholder-view">
                    <div className="placeholder-view__icon">🚧</div>
                    <h2 className="placeholder-view__title">
                      {tabs.find((t) => t.id === activeTab)?.label}
                    </h2>
                    <p className="placeholder-view__text">
                      Tính năng đang được phát triển
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
          )} /* end of activeView check */
        </div>
      </div>

      {showAddModal && (
        <AddStockModal
          existingSymbols={activeCollection?.symbols ?? []}
          onAdd={handleAddStock}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
