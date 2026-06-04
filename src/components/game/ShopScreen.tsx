import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Zap, Lock, Check, ChevronLeft, ChevronRight, Gift, Crown, Sparkles, TrendingUp, Award, Box, Diamond, Cpu, Cog, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import type { GameEngine } from '../../engine/Engine';
import { useGameState } from '../../hooks/useGameState';
import { BattlePassPlugin, BATTLE_PASS_TIERS, BATTLE_PASS_CONFIG, type BattlePassReward } from '../../plugins/BattlePassPlugin';
import type { AuthPlugin } from '../../plugins/AuthPlugin';
import { formatNumber } from '../../utils/format';
import { playSFX } from '../../hooks/useAudio';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  import.meta.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  ''
);

interface ShopScreenProps {
  engine: GameEngine;
  onClose: () => void;
}

const REWARD_ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  coins: ({ size, color }) => <span style={{ fontSize: size, color }}>$</span>,
  diamond: Diamond,
  cpu: Cpu,
  zap: Zap,
  cog: Cog,
  'trending-up': TrendingUp,
  box: Box,
  award: Award,
};

function RewardIcon({ icon, color, size = 14 }: { icon: string; color: string; size?: number }) {
  const Icon = REWARD_ICONS[icon];
  if (!Icon) return <Gift size={size} color={color} />;
  return <Icon size={size} color={color} />;
}

function RewardCard({ 
  reward, 
  claimed, 
  canClaim, 
  locked, 
  isPremium,
  onClaim 
}: { 
  reward: BattlePassReward | null;
  claimed: boolean;
  canClaim: boolean;
  locked: boolean;
  isPremium: boolean;
  onClaim: () => void;
}) {
  if (!reward) {
    return (
      <div style={{
        width: 56,
        height: 56,
        background: '#050508',
        border: '1px solid #0a0a12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.3,
      }}>
        <span style={{ color: '#1a1a2a', fontSize: 10 }}>-</span>
      </div>
    );
  }

  const bgColor = claimed ? '#0a1a12' : canClaim ? `${reward.color}15` : locked ? '#050508' : '#080810';
  const borderColor = claimed ? '#39ff14' : canClaim ? reward.color : locked ? '#1a1a28' : `${reward.color}44`;

  return (
    <div
      onClick={canClaim ? onClaim : undefined}
      style={{
        width: 56,
        height: 56,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: canClaim ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.15s',
        boxShadow: canClaim ? `0 0 12px ${reward.color}22` : 'none',
      }}
    >
      {/* Premium badge */}
      {isPremium && (
        <div style={{
          position: 'absolute',
          top: -1,
          right: -1,
          background: 'linear-gradient(135deg, #ffaa00, #ff6600)',
          width: 12,
          height: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Crown size={7} color="#000" />
        </div>
      )}
      
      {/* Claimed checkmark */}
      {claimed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(57,255,20,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Check size={20} color="#39ff14" />
        </div>
      )}
      
      {/* Locked overlay */}
      {locked && !claimed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Lock size={14} color="#3a3a4a" />
        </div>
      )}
      
      {!claimed && (
        <>
          <RewardIcon icon={reward.icon} color={locked ? '#2a2a3a' : reward.color} size={16} />
          <span className="font-pixel" style={{ 
            color: locked ? '#2a2a3a' : reward.color, 
            fontSize: 6, 
            marginTop: 3,
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: '90%',
          }}>
            {reward.label}
          </span>
        </>
      )}
    </div>
  );
}

function TierNode({ 
  tier, 
  isActive, 
  isPassed, 
  isPremium,
  freeReward,
  premiumReward,
  claimedFree,
  claimedPremium,
  canClaimFree,
  canClaimPremium,
  onClaimFree,
  onClaimPremium,
}: {
  tier: number;
  isActive: boolean;
  isPassed: boolean;
  isPremium: boolean;
  freeReward: BattlePassReward | null;
  premiumReward: BattlePassReward;
  claimedFree: boolean;
  claimedPremium: boolean;
  canClaimFree: boolean;
  canClaimPremium: boolean;
  onClaimFree: () => void;
  onClaimPremium: () => void;
}) {
  const isMilestone = tier % 10 === 0;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      minWidth: 70,
      position: 'relative',
    }}>
      {/* Premium reward (top) */}
      <RewardCard
        reward={premiumReward}
        claimed={claimedPremium}
        canClaim={canClaimPremium}
        locked={!isPremium || (!isPassed && !isActive)}
        isPremium
        onClaim={onClaimPremium}
      />
      
      {/* Tier number */}
      <div style={{
        width: isMilestone ? 32 : 24,
        height: isMilestone ? 32 : 24,
        background: isActive 
          ? 'linear-gradient(135deg, #00f5ff, #0080ff)' 
          : isPassed 
            ? '#39ff14' 
            : '#1a1a28',
        border: `2px solid ${isActive ? '#00f5ff' : isPassed ? '#39ff14' : '#2a2a3a'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        boxShadow: isActive ? '0 0 16px rgba(0,245,255,0.5)' : isPassed ? '0 0 8px rgba(57,255,20,0.3)' : 'none',
      }}>
        <span className="font-pixel" style={{ 
          color: isActive || isPassed ? '#000' : '#4a4a5a', 
          fontSize: isMilestone ? 10 : 8,
          fontWeight: 'bold',
        }}>
          {tier}
        </span>
      </div>
      
      {/* Free reward (bottom) */}
      <RewardCard
        reward={freeReward}
        claimed={claimedFree}
        canClaim={canClaimFree}
        locked={!isPassed && !isActive}
        isPremium={false}
        onClaim={onClaimFree}
      />
    </div>
  );
}

// Checkout Modal Component
function CheckoutModal({ 
  onClose, 
  onSuccess,
  userId,
  userEmail,
}: { 
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userEmail?: string;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'google_play'>('stripe');

  // Detect if on Android/Capacitor
  const isAndroid = typeof window !== 'undefined' && 
    (window.navigator.userAgent.toLowerCase().includes('android') || 
     (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

  useEffect(() => {
    if (paymentMethod === 'stripe') {
      // Fetch client secret from our API
      fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError(data.error || 'Failed to create checkout session');
          }
        })
        .catch(err => {
          console.error('Checkout error:', err);
          setError('Failed to connect to payment server');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId, userEmail, paymentMethod]);

  const handleGooglePlayPurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would use Capacitor's in-app purchase plugin
      // For now, we'll show a placeholder
      // You would integrate: @capawesome-team/capacitor-purchases or similar
      
      // Simulated Google Play purchase flow
      const purchaseToken = 'SIMULATED_TOKEN'; // This would come from Google Play
      
      const response = await fetch('/api/google-play/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          purchaseToken,
          productId: 'battle_pass_season_1',
          packageName: 'com.overclock.exe',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Purchase verification failed');
      }
    } catch (err) {
      console.error('Google Play purchase error:', err);
      setError('Failed to process purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        background: 'linear-gradient(180deg, #0a0a14 0%, #050508 100%)',
        border: '1px solid #2a2a3a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1a1a28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(255,102,0,0.1), rgba(255,170,0,0.1))',
        }}>
          <div className="flex items-center gap-3">
            <Crown size={20} color="#ffaa00" />
            <div>
              <h3 className="font-pixel" style={{ color: '#ffaa00', fontSize: 12, letterSpacing: '2px', margin: 0 }}>
                UNLOCK PREMIUM
              </h3>
              <div style={{ color: '#8a7a6a', fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 2 }}>
                Season 1 Battle Pass - ${BATTLE_PASS_CONFIG.price}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #2a2a3a',
              color: '#5a5a6a',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Payment Method Selection (if on Android) */}
        {isAndroid && (
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #1a1a28',
            display: 'flex',
            gap: 8,
          }}>
            <button
              onClick={() => setPaymentMethod('stripe')}
              style={{
                flex: 1,
                padding: '10px',
                background: paymentMethod === 'stripe' ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: `1px solid ${paymentMethod === 'stripe' ? '#6366f1' : '#2a2a3a'}`,
                color: paymentMethod === 'stripe' ? '#6366f1' : '#5a5a6a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <CreditCard size={14} />
              <span className="font-pixel" style={{ fontSize: 8 }}>CARD</span>
            </button>
            <button
              onClick={() => setPaymentMethod('google_play')}
              style={{
                flex: 1,
                padding: '10px',
                background: paymentMethod === 'google_play' ? 'rgba(52,168,83,0.2)' : 'transparent',
                border: `1px solid ${paymentMethod === 'google_play' ? '#34a853' : '#2a2a3a'}`,
                color: paymentMethod === 'google_play' ? '#34a853' : '#5a5a6a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Smartphone size={14} />
              <span className="font-pixel" style={{ fontSize: 8 }}>GOOGLE PLAY</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,0,80,0.1)',
              border: '1px solid #ff0050',
              marginBottom: 16,
            }}>
              <span style={{ color: '#ff0050', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {error}
              </span>
            </div>
          )}

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}>
              <Loader2 size={24} color="#ffaa00" className="animate-spin" />
              <span style={{ color: '#5a5a6a', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                Loading checkout...
              </span>
            </div>
          ) : paymentMethod === 'google_play' ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: 20,
            }}>
              <Smartphone size={48} color="#34a853" />
              <p style={{ color: '#8a8a8a', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center' }}>
                Complete your purchase through Google Play
              </p>
              <button
                onClick={handleGooglePlayPurchase}
                className="font-pixel"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'linear-gradient(90deg, #34a853, #4caf50)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11,
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Smartphone size={14} />
                PAY WITH GOOGLE PLAY
              </button>
            </div>
          ) : clientSecret ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ 
                clientSecret,
                onComplete: () => {
                  onSuccess();
                  onClose();
                },
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}>
              <X size={24} color="#ff0050" />
              <span style={{ color: '#ff0050', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                Unable to load checkout
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ engine, onClose }) => {
  const battlePassPlugin = engine.getPlugin<BattlePassPlugin>('battlepass');
  const authPlugin = engine.getPlugin<AuthPlugin>('auth');
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => battlePassPlugin?.subscribe(refresh), [battlePassPlugin, refresh]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const bpState = battlePassPlugin?.getState();
  const tierProgress = battlePassPlugin?.getTierProgress();
  const unclaimedCount = battlePassPlugin?.getUnclaimedCount();
  const player = authPlugin?.getPlayer();

  // Scroll to current tier on mount
  useEffect(() => {
    if (scrollRef.current && bpState) {
      const tierWidth = 78; // 70px + 8px gap
      const scrollPos = Math.max(0, (bpState.currentTier - 3) * tierWidth);
      scrollRef.current.scrollLeft = scrollPos;
    }
  }, [bpState?.currentTier]);

  const handleClaimReward = (tier: number, isPremium: boolean) => {
    const success = battlePassPlugin?.claimReward(tier, isPremium);
    if (success) {
      playSFX.purchase();
    }
  };

  const handlePurchasePremium = () => {
    setShowCheckout(true);
  };

  const handlePurchaseSuccess = () => {
    // The webhook will update the database, but we also update local state
    battlePassPlugin?.purchasePremium();
    playSFX.purchase();
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!bpState || !tierProgress) return null;

  return (
    <>
      <div
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 200, 
          background: 'rgba(0,0,0,0.92)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '95vh',
          background: 'linear-gradient(180deg, #0a0a14 0%, #050508 100%)',
          border: '1px solid #1a2a3a',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 12px',
          overflow: 'hidden',
        }}>
          {/* Hero Header */}
          <div style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0a0020 0%, #100030 50%, #0a0020 100%)',
            borderBottom: '1px solid #2a1a4a',
            padding: '20px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated background lines */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,245,255,0.03) 40px, rgba(0,245,255,0.03) 41px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at top, rgba(153,51,255,0.15) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />
            
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid #2a2a3a',
                color: '#5a5a6a',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <X size={14} />
            </button>
            
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #9933ff, #ff0080)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(153,51,255,0.4)',
              }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h2 className="font-pixel" style={{ 
                  color: '#fff', 
                  fontSize: 16, 
                  margin: 0,
                  textShadow: '0 0 20px rgba(153,51,255,0.8)',
                  letterSpacing: '3px',
                }}>
                  OVERCLOCK PROTOCOL
                </h2>
                <div style={{ color: '#8a7aaa', fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 2 }}>
                  SEASON 1 - NEURAL UPRISING
                </div>
              </div>
            </div>

            {/* Tier & XP Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #00f5ff22, #00808022)',
                border: '2px solid #00f5ff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0,245,255,0.3)',
              }}>
                <span style={{ color: '#6a8a9a', fontFamily: 'var(--font-mono)', fontSize: 8 }}>TIER</span>
                <span className="font-pixel" style={{ color: '#00f5ff', fontSize: 20 }}>{bpState.currentTier}</span>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#6a7a8a', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                    {formatNumber(tierProgress.current)} / {formatNumber(tierProgress.max)} XP
                  </span>
                  <span className="font-pixel" style={{ color: '#9933ff', fontSize: 8 }}>
                    {tierProgress.percent.toFixed(0)}%
                  </span>
                </div>
                <div style={{ 
                  height: 8, 
                  background: '#1a1a28', 
                  border: '1px solid #2a2a3a',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${tierProgress.percent}%`,
                    background: 'linear-gradient(90deg, #9933ff, #00f5ff)',
                    boxShadow: '0 0 10px rgba(153,51,255,0.5)',
                    transition: 'width 0.3s',
                  }} />
                </div>
                
                {/* Unclaimed rewards indicator */}
                {(unclaimedCount?.free ?? 0) + (unclaimedCount?.premium ?? 0) > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {(unclaimedCount?.free ?? 0) > 0 && (
                      <span className="font-pixel" style={{ color: '#39ff14', fontSize: 7 }}>
                        {unclaimedCount?.free} FREE REWARDS
                      </span>
                    )}
                    {(unclaimedCount?.premium ?? 0) > 0 && (
                      <span className="font-pixel" style={{ color: '#ffaa00', fontSize: 7 }}>
                        {unclaimedCount?.premium} PREMIUM REWARDS
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Premium purchase button */}
            {!bpState.isPremium && (
              <button
                onClick={handlePurchasePremium}
                className="font-pixel"
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'linear-gradient(90deg, #ff6600, #ffaa00)',
                  border: 'none',
                  color: '#000',
                  fontSize: 11,
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 0 20px rgba(255,170,0,0.4)',
                }}
              >
                <Crown size={14} color="#000" />
                UNLOCK PREMIUM TRACK - ${BATTLE_PASS_CONFIG.price}
              </button>
            )}
            
            {bpState.isPremium && (
              <div style={{
                width: '100%',
                marginTop: 16,
                padding: '10px 16px',
                background: 'linear-gradient(90deg, rgba(255,102,0,0.2), rgba(255,170,0,0.2))',
                border: '1px solid #ffaa0055',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
                <Crown size={12} color="#ffaa00" />
                <span className="font-pixel" style={{ color: '#ffaa00', fontSize: 9, letterSpacing: '2px' }}>
                  PREMIUM ACTIVE
                </span>
              </div>
            )}
          </div>

          {/* Track Labels */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            padding: '8px 16px',
            borderBottom: '1px solid #1a1a28',
            background: '#06060c',
          }}>
            <div style={{ width: 70 }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Crown size={10} color="#ffaa00" />
                <span className="font-pixel" style={{ color: '#ffaa00', fontSize: 7, letterSpacing: '1px' }}>
                  PREMIUM TRACK
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Gift size={10} color="#5a7a8a" />
                <span className="font-pixel" style={{ color: '#5a7a8a', fontSize: 7, letterSpacing: '1px' }}>
                  FREE TRACK
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Tier Track */}
          <div style={{ 
            flex: 1, 
            position: 'relative',
            background: '#050508',
          }}>
            {/* Scroll buttons */}
            <button
              onClick={() => handleScroll('left')}
              style={{
                position: 'absolute',
                left: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 32,
                height: 48,
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid #2a2a3a',
                color: '#5a5a6a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              style={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 32,
                height: 48,
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid #2a2a3a',
                color: '#5a5a6a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>

            {/* Tier nodes container */}
            <div
              ref={scrollRef}
              style={{
                display: 'flex',
                gap: 8,
                padding: '16px 48px',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {/* Progress line */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 48,
                right: 48,
                height: 3,
                background: '#1a1a28',
                zIndex: 0,
              }}>
                <div style={{
                  height: '100%',
                  width: `${((bpState.currentTier - 1) / (BATTLE_PASS_CONFIG.maxTier - 1)) * 100}%`,
                  background: 'linear-gradient(90deg, #39ff14, #00f5ff)',
                  boxShadow: '0 0 8px rgba(57,255,20,0.5)',
                  transition: 'width 0.3s',
                }} />
              </div>

              {BATTLE_PASS_TIERS.map((tier, idx) => {
                const tierNum = idx + 1;
                const isActive = bpState.currentTier === tierNum;
                const isPassed = bpState.currentTier > tierNum;
                
                return (
                  <TierNode
                    key={tierNum}
                    tier={tierNum}
                    isActive={isActive}
                    isPassed={isPassed}
                    isPremium={bpState.isPremium}
                    freeReward={tier.freeReward}
                    premiumReward={tier.premiumReward}
                    claimedFree={bpState.claimedFreeTiers.includes(tierNum)}
                    claimedPremium={bpState.claimedPremiumTiers.includes(tierNum)}
                    canClaimFree={battlePassPlugin?.canClaimReward(tierNum, false) ?? false}
                    canClaimPremium={battlePassPlugin?.canClaimReward(tierNum, true) ?? false}
                    onClaimFree={() => handleClaimReward(tierNum, false)}
                    onClaimPremium={() => handleClaimReward(tierNum, true)}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer with boost info */}
          <div style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderTop: '1px solid #1a1a28',
            background: '#06060c',
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
          }}>
            {bpState.xpBoostMultiplier > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={10} color="#9933ff" />
                <span style={{ color: '#9933ff', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                  +{((bpState.xpBoostMultiplier - 1) * 100).toFixed(0)}% XP
                </span>
              </div>
            )}
            {bpState.goldBoostMultiplier > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={10} color="#ffaa00" />
                <span style={{ color: '#ffaa00', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                  +{((bpState.goldBoostMultiplier - 1) * 100).toFixed(0)}% GOLD
                </span>
              </div>
            )}
            {bpState.xpBoostMultiplier <= 1 && bpState.goldBoostMultiplier <= 1 && (
              <span style={{ color: '#3a3a4a', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                Unlock premium to earn boosts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      {showCheckout && player && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={handlePurchaseSuccess}
          userId={player.id}
          userEmail={player.email}
        />
      )}
    </>
  );
};
