import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const MODAL_TONES = {
  danger: {
    accent: '#A83B2B',
    buttonBg: '#9E3324',
    boxBg: '#F9ECEA',
    boxBorder: '#E8C4BE',
    boxText: '#7D281C',
  },
  warning: {
    accent: '#9A6324',
    buttonBg: '#9A6324',
    boxBg: '#FAF3E8',
    boxBorder: '#E8D5B5',
    boxText: '#7C4F1C',
  },
};

/**
 * Shared confirmation modal for destructive or traffic-impacting actions.
 * When `confirmText` is provided, requires typing that exact string
 * before the action button is unlocked.
 */
export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  variant = 'danger',
  eyebrow = 'DANGER ZONE',
  title,
  description,
  impactItems = [],
  confirmText = '',
  confirmLabel = 'Delete permanently',
  loadingLabel = 'Deleting...',
  loading = false,
  error = '',
}) {
  const tone = MODAL_TONES[variant] || MODAL_TONES.danger;
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open, confirmText]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const requiresTyping = Boolean(confirmText);
  const canConfirm = !requiresTyping || typed === confirmText;

  function handleSubmit(e) {
    e.preventDefault();
    if (!loading && canConfirm) onConfirm();
  }

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div
          className="modal-header"
          style={{
            marginBottom: '18px',
            paddingBottom: '16px',
            borderBottom: '1px solid #EAE6DD',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: tone.boxBg,
                border: `1px solid ${tone.boxBorder}`,
                color: tone.accent,
              }}
            >
              <AlertTriangle size={15} />
            </span>
            <h2
              id="confirm-delete-title"
              style={{ fontSize: '20px', fontWeight: 500, margin: 0, color: '#1C1B18', letterSpacing: '-0.02em', lineHeight: 1.25 }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              color: '#5F5C55',
              padding: '4px',
              borderRadius: '2px',
            }}
            aria-label="Close modal"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '9px 12px',
                backgroundColor: '#F9ECEA',
                border: '1px solid #E8C4BE',
                borderRadius: '2px',
                fontSize: '13px',
                color: '#A83B2B',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <p
            style={{
              fontSize: '14px',
              color: '#4A4843',
              marginBottom: impactItems.length ? '16px' : '22px',
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>

          {impactItems.length > 0 && (
            <ul
              style={{
                margin: '0 0 20px',
                padding: '12px 14px 12px 28px',
                background: tone.boxBg,
                border: `1px solid ${tone.boxBorder}`,
                borderRadius: '2px',
                fontSize: '13px',
                color: tone.boxText,
                lineHeight: 1.65,
              }}
            >
              {impactItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}

          {requiresTyping && (
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="confirm-delete-input"
                style={{ fontWeight: 400, color: '#4A4843', marginBottom: '8px', lineHeight: 1.5 }}
              >
                To confirm, type{' '}
                <code
                  style={{
                    font: '500 12px "IBM Plex Mono", monospace',
                    background: '#F2EFE8',
                    border: '1px solid #DCD7CD',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    color: '#1C1B18',
                    userSelect: 'all',
                  }}
                >
                  {confirmText}
                </code>{' '}
                below:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmText}
                autoComplete="off"
                spellCheck={false}
                autoFocus
                disabled={loading}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid #EAE6DD',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canConfirm}
              style={{
                background: tone.buttonBg,
                color: '#FBF9F5',
                border: `1px solid ${tone.buttonBg}`,
                borderRadius: '2px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {loading ? loadingLabel : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
