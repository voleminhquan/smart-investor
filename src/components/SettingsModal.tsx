import { useState, useEffect, useRef } from 'react';
import { fetchSyncStatus, triggerFullSync, type SyncStatus } from '../services/api';
import './SettingsModal.css';

const VNSTOCK_KEY_STORAGE = 'smart-investor-vnstock-key';

export function getVnstockKey(): string {
  return localStorage.getItem(VNSTOCK_KEY_STORAGE) ?? '';
}

export function saveVnstockKey(key: string): void {
  localStorage.setItem(VNSTOCK_KEY_STORAGE, key);
}

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    setApiKey(getVnstockKey());
    loadSyncStatus();

    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await fetchSyncStatus();
      setSyncStatus(status);
      setIsSyncing(status.syncing);
      
      if (status.syncing && !pollTimer.current) {
        pollTimer.current = window.setInterval(loadSyncStatus, 3000);
      } else if (!status.syncing && pollTimer.current) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    } catch (err) {
      console.error('Failed to load sync status:', err);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      await triggerFullSync();
      // Start polling
      if (!pollTimer.current) {
        pollTimer.current = window.setInterval(loadSyncStatus, 3000);
      }
    } catch (err: any) {
      alert(`Lỗi đồng bộ: ${err.message}`);
      setIsSyncing(false);
    }
  };

  const handleSave = () => {
    saveVnstockKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal__header">
          <h3>⚙️ Cài đặt</h3>
          <button className="settings-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="settings-modal__body">
          {/* vnstock API Key */}
          <div className="settings-section">
            <div className="settings-section__header">
              <h4 className="settings-section__title">vnstock API Key</h4>
              <span className="settings-section__badge">Nguồn dữ liệu</span>
            </div>
            <p className="settings-section__desc">
              Nhập API key từ vnstock để lấy dữ liệu cổ phiếu real-time, 
              báo cáo tài chính, và thông tin công ty.
            </p>

            <div className="settings-field">
              <label className="settings-field__label" htmlFor="vnstock-key">API Key</label>
              <div className="settings-field__input-group">
                <input
                  id="vnstock-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Nhập API key của bạn..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="settings-field__input"
                />
                <button
                  className="settings-field__toggle"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Ẩn key' : 'Hiện key'}
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="settings-section__help">
              <div className="settings-help-card">
                <h5>📋 Cách lấy API Key</h5>
                <ol>
                  <li>Truy cập <a href="https://vnstocks.com/login" target="_blank" rel="noopener noreferrer">vnstocks.com/login</a></li>
                  <li>Đăng nhập bằng Google</li>
                  <li>Vào mục <strong>API Key</strong> trong tài khoản</li>
                  <li>Copy key và dán vào ô trên</li>
                </ol>
              </div>
            </div>

            <div className="settings-section__status">
              <div className={`settings-status ${apiKey.trim() ? 'settings-status--connected' : 'settings-status--disconnected'}`}>
                <span className="settings-status__dot"></span>
                <span>{apiKey.trim() ? 'Đã có API key' : 'Chưa kết nối'}</span>
              </div>
            </div>
          </div>

          {/* Data Sources Info */}
          <div className="settings-section">
            <h4 className="settings-section__title">Nguồn dữ liệu</h4>
            <div className="settings-sources">
              <div className="settings-source">
                <span className="settings-source__icon">📊</span>
                <div className="settings-source__info">
                  <span className="settings-source__name">vnstock</span>
                  <span className="settings-source__desc">Giá cổ phiếu, BCTC, thông tin công ty</span>
                </div>
                <span className={`settings-source__status ${apiKey.trim() ? 'active' : ''}`}>
                  {apiKey.trim() ? '✓' : '—'}
                </span>
              </div>
              <div className="settings-source">
                <span className="settings-source__icon">📈</span>
                <div className="settings-source__info">
                  <span className="settings-source__name">TCBS Public API</span>
                  <span className="settings-source__desc">Dữ liệu bổ sung (không cần key)</span>
                </div>
                <span className="settings-source__status active">✓</span>
              </div>
            </div>
          </div>

          {/* Data Synchronization */}
          <div className="settings-section">
            <div className="settings-section__header">
              <h4 className="settings-section__title">Đồng bộ dữ liệu</h4>
              {isSyncing && <span className="settings-section__badge settings-section__badge--syncing">Đang chạy...</span>}
            </div>
            <p className="settings-section__desc">
              Cập nhật giá mới nhất và chỉ số tài chính cho toàn bộ danh mục của bạn.
            </p>

            <div className="sync-status-card">
              <div className="sync-status-card__info">
                <span className="sync-status-card__label">Lần cuối:</span>
                <span className="sync-status-card__value">
                  {syncStatus?.lastSync?.finished_at 
                    ? new Date(syncStatus.lastSync.finished_at).toLocaleString('vi-VN') + ' (' + syncStatus.lastSync.status + ')'
                    : 'Chưa có thông tin'}
                </span>
                {syncStatus?.lastSync?.records_count ? (
                  <span className="sync-status-card__subtext">
                    {syncStatus.lastSync.records_count} bản ghi đã cập nhật
                  </span>
                ) : null}
              </div>
              <button 
                className={`sync-btn ${isSyncing ? 'sync-btn--loading' : ''}`}
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? '⌛ Đang kéo số...' : '🔄 Cập nhật ngay'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-modal__footer">
          <button className="settings-btn settings-btn--ghost" onClick={onClose}>Đóng</button>
          <button
            className={`settings-btn settings-btn--primary ${saved ? 'settings-btn--saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Đã lưu!' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
}
