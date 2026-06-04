// =====================================================================
// DataPacketPopup - Floating ad-reward notification
// Supports: basic packets, encrypted packets, and 3x boost packets
// =====================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Wifi, Lock, X, Zap, Timer } from 'lucide-react';
import type { GameEngine } from '../../engine/Engine';
import type { DataPacketPlugin, ActiveDataPacket, ActiveBoost } from '../../plugins/DataPacketPlugin';
import { DATAPACKET_CONFIG } from '../../config/datapacket.config';
import { formatNumber } from '../../utils/format';

interface DataPacketPopupProps {
  engine: GameEngine;
}

export const DataPacketPopup: React.FC<DataPacketPopupProps> = ({ engine }) => {
  const [packet, setPacket] = useState<ActiveDataPacket | null>(null);
  const [boost, setBoost] = useState<ActiveBoost | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);
  const [showCollected, setShowCollected] = useState<{ gold: number; type: string; boostActivated?: boolean } | null>(null);

  const plugin = engine.getPlugin<DataPacketPlugin>('datapacket');

  // Sync state from plugin
  useEffect(() => {
    if (!plugin) return;

    const syncState = () => {
      setPacket(plugin.getActivePacket());
      setBoost(plugin.getActiveBoost());
      setIsProcessing(plugin.getIsProcessing());
    };

    syncState();
    return plugin.subscribe(syncState);
  }, [plugin]);

  // Countdown timer for packet
  useEffect(() => {
    if (!packet) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, packet.expiresAt - Date.now());
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [packet]);

  // Countdown timer for boost
  useEffect(() => {
    if (!boost) {
      setBoostTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, boost.expiresAt - Date.now());
      setBoostTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [boost]);

  // Listen for collection events to show feedback
  useEffect(() => {
    const unsub = engine.on<{ type: string; goldReward: number; boostActivated?: boolean }>('datapacket_collected', event => {
      setShowCollected({ 
        gold: event.payload.goldReward, 
        type: event.payload.type,
        boostActivated: event.payload.boostActivated,
      });
      setTimeout(() => setShowCollected(null), 2500);
    });
    return unsub;
  }, [engine]);

  const handleCollect = useCallback(async () => {
    if (!plugin || !packet || isProcessing) return;

    if (packet.def.requiresAd) {
      setIsProcessing(true);
      try {
        await plugin.collectEncryptedPacket();
      } catch {
        // Ad failed or cancelled
      } finally {
        setIsProcessing(false);
      }
    } else {
      plugin.collectBasicPacket();
    }
  }, [plugin, packet, isProcessing]);

  const handleDismiss = useCallback(() => {
    if (!plugin || isProcessing) return;
    plugin.dismissPacket();
  }, [plugin, isProcessing]);

  // Show collected feedback
  if (showCollected) {
    const isBoost = showCollected.boostActivated;
    return (
      <div
        style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        <div
          className="font-pixel"
          style={{
            background: isBoost ? 'rgba(57, 255, 20, 0.2)' : 'rgba(57, 255, 20, 0.15)',
            border: `1px solid ${isBoost ? '#39ff14' : '#39ff14'}`,
            padding: '12px 20px',
            color: '#39ff14',
            fontSize: '10px',
            letterSpacing: '2px',
            textAlign: 'center',
            boxShadow: `0 0 ${isBoost ? 30 : 20}px rgba(57, 255, 20, ${isBoost ? 0.5 : 0.3})`,
          }}
        >
          {isBoost
            ? DATAPACKET_CONFIG.messages.boostActivated
            : showCollected.type === 'encrypted'
              ? DATAPACKET_CONFIG.messages.encryptedCollect
              : DATAPACKET_CONFIG.messages.basicCollect}
          {!isBoost && (
            <div style={{ marginTop: 4, fontSize: '12px' }}>
              +{formatNumber(showCollected.gold)} GOLD
            </div>
          )}
          {isBoost && (
            <div style={{ marginTop: 4, fontSize: '11px', color: '#ffaa00' }}>
              60 SECONDS
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show active boost indicator (persistent while boost is active)
  const boostIndicator = boost && boostTimeLeft > 0 && (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 90,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div
        style={{
          background: 'rgba(57, 255, 20, 0.15)',
          border: '1px solid #39ff14',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)',
        }}
      >
        <Zap size={14} color="#39ff14" />
        <div>
          <div className="font-pixel" style={{ color: '#39ff14', fontSize: '8px', letterSpacing: '1px' }}>
            3X GOLD
          </div>
          <div style={{ color: '#5aaa5a', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
            {Math.ceil(boostTimeLeft / 1000)}s
          </div>
        </div>
      </div>
    </div>
  );

  // No active packet
  if (!packet) return boostIndicator;

  const isEncrypted = packet.def.requiresAd;
  const isBoostPacket = packet.type === 'boost_3x';
  const progressPercent = (timeLeft / DATAPACKET_CONFIG.packetLifetime) * 100;

  return (
    <>
      {boostIndicator}
      <div
        style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            background: '#0a0a12',
            border: `1px solid ${packet.def.color}55`,
            boxShadow: `0 0 25px ${packet.def.color}22, inset 0 0 15px ${packet.def.color}08`,
            padding: '0',
            minWidth: 220,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Timer bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: 2,
              width: `${progressPercent}%`,
              background: packet.def.color,
              transition: 'width 0.1s linear',
            }}
          />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'none',
              border: 'none',
              color: '#3a4a5a',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              padding: 2,
              opacity: isProcessing ? 0.3 : 1,
            }}
          >
            <X size={12} />
          </button>

          {/* Content */}
          <div style={{ padding: '14px 16px 12px' }}>
            {/* Header with icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: `${packet.def.color}15`,
                  border: `1px solid ${packet.def.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: packet.def.color,
                }}
              >
                {isBoostPacket ? <Zap size={18} /> : isEncrypted ? <Lock size={18} /> : <Wifi size={18} />}
              </div>
              <div>
                <div
                  className="font-pixel"
                  style={{
                    color: packet.def.color,
                    fontSize: '8px',
                    letterSpacing: '2px',
                  }}
                >
                  {packet.def.name}
                </div>
                <div
                  style={{
                    color: '#5a6a7a',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    marginTop: 2,
                  }}
                >
                  {packet.def.description}
                </div>
              </div>
            </div>

            {/* Reward display - different for boost vs gold */}
            {isBoostPacket ? (
              <div
                style={{
                  background: '#05050a',
                  border: '1px solid #39ff1433',
                  padding: '10px 12px',
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Timer size={14} color="#39ff14" />
                  <span
                    className="font-pixel"
                    style={{
                      color: '#39ff14',
                      fontSize: '12px',
                      textShadow: '0 0 8px rgba(57, 255, 20, 0.5)',
                    }}
                  >
                    3X GOLD FOR 60s
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#05050a',
                  border: '1px solid #1a1a2a',
                  padding: '8px 12px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#3a5a6a', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  REWARD:
                </span>
                <span
                  className="font-pixel"
                  style={{
                    color: '#ffd700',
                    fontSize: '11px',
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
                  }}
                >
                  +{formatNumber(packet.goldReward)} ◆
                </span>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleCollect}
              disabled={isProcessing}
              className="font-pixel"
              style={{
                width: '100%',
                background: isProcessing
                  ? '#1a1a2a'
                  : isBoostPacket
                  ? 'linear-gradient(180deg, #39ff14 0%, #29cc09 100%)'
                  : isEncrypted
                  ? 'linear-gradient(180deg, #ffaa00 0%, #cc8800 100%)'
                  : `${packet.def.color}22`,
                border: `1px solid ${isProcessing ? '#2a2a3a' : packet.def.color}`,
                color: isProcessing ? '#3a4a5a' : (isEncrypted || isBoostPacket) ? '#000' : packet.def.color,
                padding: '10px 16px',
                fontSize: '9px',
                letterSpacing: '2px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                textShadow: (isEncrypted || isBoostPacket) && !isProcessing ? 'none' : `0 0 8px ${packet.def.color}`,
              }}
            >
              {isProcessing
                ? DATAPACKET_CONFIG.messages.processing
                : isEncrypted || isBoostPacket
                ? DATAPACKET_CONFIG.messages.watchAdPrompt
                : DATAPACKET_CONFIG.messages.collectPrompt}
            </button>

            {/* Timer text */}
            <div
              style={{
                textAlign: 'center',
                marginTop: 8,
                color: '#3a4a5a',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
              }}
            >
              {Math.ceil(timeLeft / 1000)}s
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    </>
  );
};
