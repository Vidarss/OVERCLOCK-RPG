import React, { useState } from 'react';

interface ComplaintBookProps {
  onClose: () => void;
}

export const ComplaintBook: React.FC<ComplaintBookProps> = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (message.trim()) {
      console.log('[ComplaintBook] Feedback submitted:', message);
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="pixel-border"
        style={{
          background: '#0a0a12',
          borderColor: '#ff4444',
          padding: 24,
          maxWidth: 400,
          width: '90%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="font-pixel"
          style={{
            color: '#ff4444',
            fontSize: 12,
            letterSpacing: 2,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {'> COMPLAINT BOOK'}
        </div>

        {!submitted ? (
          <>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your feedback here..."
              className="font-pixel"
              style={{
                width: '100%',
                height: 120,
                background: '#050508',
                border: '1px solid #2a2a3a',
                color: '#8a9aaa',
                padding: 12,
                fontSize: 10,
                resize: 'none',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                className="font-pixel pixel-border"
                style={{
                  flex: 1,
                  background: '#0a0a0f',
                  borderColor: '#2a3a4a',
                  color: '#5a6a7a',
                  padding: '10px 0',
                  fontSize: 9,
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                className="font-pixel pixel-border"
                style={{
                  flex: 1,
                  background: '#1a0808',
                  borderColor: '#ff4444',
                  color: '#ff4444',
                  padding: '10px 0',
                  fontSize: 9,
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(255,68,68,0.3)',
                }}
              >
                SUBMIT
              </button>
            </div>
          </>
        ) : (
          <div
            className="font-pixel"
            style={{
              color: '#44ff44',
              fontSize: 10,
              textAlign: 'center',
              padding: 20,
            }}
          >
            FEEDBACK RECEIVED. THANK YOU.
          </div>
        )}
      </div>
    </div>
  );
};
