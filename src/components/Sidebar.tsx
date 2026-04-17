import { useState } from 'react';
import type { Collection } from '../services/api';
import './Sidebar.css';

interface SidebarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string) => void;
  onCreateCollection: (name: string, icon: string) => void;
  onDeleteCollection: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  activeView: 'watchlist' | 'portfolio';
  onSelectView: (view: 'watchlist' | 'portfolio') => void;
}

const ICONS = ['⭐', '💎', '🏦', '🏭', '🛒', '💊', '⚡', '🏗️', '📊', '🎯', '🚀', '🔥'];

export function Sidebar({
  collections,
  activeCollectionId,
  onSelectCollection,
  onCreateCollection,
  onDeleteCollection,
  onOpenSettings,
  isOpen,
  onClose,
  activeView,
  onSelectView
}: SidebarProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateCollection(newName.trim(), newIcon);
      setNewName('');
      setNewIcon('⭐');
      setShowCreate(false);
    }
  };

  const handleSelectCollection = (id: string) => {
    onSelectCollection(id);
    onSelectView('watchlist');
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">📈</span>
            <h2 className="sidebar__logo-text">Smart Investor</h2>
          </div>
          <button className="sidebar__close-btn" onClick={onClose}>×</button>
        </div>

        <div className="sidebar__section-label">Quản lý tài sản</div>
        <nav className="sidebar__nav" style={{ flex: "none" }}>
          <div
            className={`sidebar__item ${activeView === 'portfolio' ? 'sidebar__item--active' : ''}`}
            onClick={() => {
              onSelectView('portfolio');
              onClose();
            }}
          >
            <span className="sidebar__item-icon">💼</span>
            <div className="sidebar__item-info">
              <span className="sidebar__item-name">Hiệu quả đầu tư</span>
            </div>
          </div>
        </nav>

        <div className="sidebar__section-label" style={{ marginTop: '16px' }}>Danh mục theo dõi</div>

        <nav className="sidebar__nav">
          {collections.map((col) => (
            <div
              key={col.id}
              className={`sidebar__item ${activeView === 'watchlist' && activeCollectionId === col.id ? 'sidebar__item--active' : ''}`}
              onClick={() => handleSelectCollection(col.id)}
            >
              <span className="sidebar__item-icon">{col.icon}</span>
              <div className="sidebar__item-info">
                <span className="sidebar__item-name">{col.name}</span>
                <span className="sidebar__item-count">{col.symbols.length} mã</span>
              </div>
              {collections.length > 1 && (
                <button
                  className="sidebar__item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection(col.id);
                  }}
                  title="Xóa danh mục"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </nav>

        {showCreate ? (
          <div className="sidebar__create-form">
            <div className="sidebar__icon-picker">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  className={`sidebar__icon-btn ${newIcon === icon ? 'sidebar__icon-btn--active' : ''}`}
                  onClick={() => setNewIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              className="sidebar__create-input"
              placeholder="Tên danh mục..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="sidebar__create-actions">
              <button className="sidebar__btn sidebar__btn--ghost" onClick={() => setShowCreate(false)}>
                Hủy
              </button>
              <button className="sidebar__btn sidebar__btn--primary" onClick={handleCreate}>
                Tạo
              </button>
            </div>
          </div>
        ) : (
          <button className="sidebar__add-btn" onClick={() => setShowCreate(true)}>
            <span>+</span> Tạo danh mục mới
          </button>
        )}

        <div className="sidebar__footer">
          <button className="sidebar__settings-btn" onClick={onOpenSettings}>
            <span>⚙️</span> Cài đặt
          </button>
        </div>
      </aside>
    </>
  );
}
