import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
  isRefreshing?: boolean;
}

type RefreshStatus = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'completed' | 'error';

/**
 * Custom Premium Arrow Circle SVG (↻)
 * Dynamically draws the circular path and arrow head in direct proportion to pull depth.
 */
const PremiumArrowCircle: React.FC<{
  progress: number;
  status: RefreshStatus;
}> = ({ progress, status }) => {
  const isSpinning = status === 'refreshing';
  const isReady = status === 'ready';

  // SVG Geometry: Circle centered at (12, 12), Radius = 7.8
  const radius = 7.8;
  const circumference = 2 * Math.PI * radius; // ~49.0
  const activeArcLength = circumference * 0.85; // 85% of full circle to leave space for arrowhead
  const strokeDashoffset = isSpinning
    ? 0
    : circumference - Math.min(progress, 1) * activeArcLength;

  return (
    <div
      className={`relative w-6 h-6 flex items-center justify-center transition-transform duration-200 ${
        isReady ? 'scale-110' : 'scale-100'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-5 h-5 ${isSpinning ? 'animate-[spin_0.8s_linear_infinite]' : ''}`}
        style={{
          transform: isSpinning ? undefined : `rotate(${Math.min(progress, 1) * 240}deg)`,
          transition: isSpinning ? 'none' : 'transform 0.08s linear',
        }}
      >
        {/* Subtle Background Track */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className="text-black/[0.08] dark:text-white/[0.12]"
        />

        {/* Dynamic Circular Arc that fills with gesture */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={isReady || isSpinning ? 'var(--color-accent, #FF9B51)' : 'currentColor'}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-colors duration-200 ${
            !isReady && !isSpinning ? 'text-[#8E8E93] dark:text-slate-400' : ''
          }`}
          transform="rotate(-90 12 12)"
        />

        {/* Arrowhead at the leading tip of the circular arc */}
        <g
          style={{
            transformOrigin: '12px 12px',
            transform: `rotate(${isSpinning ? 0 : Math.min(progress, 1) * 260}deg)`,
            opacity: progress > 0.12 || isSpinning ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          <path
            d="M 12 1.6 L 15.6 4.8 L 12 8 Z"
            fill={isReady || isSpinning ? 'var(--color-accent, #FF9B51)' : 'currentColor'}
            className={`transition-colors duration-200 ${
              !isReady && !isSpinning ? 'text-[#8E8E93] dark:text-slate-400' : ''
            }`}
          />
        </g>
      </svg>
    </div>
  );
};

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 60,
  maxPullDistance = 105,
  className = '',
  isRefreshing: externalIsRefreshing,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<RefreshStatus>('idle');
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const canPullRef = useRef<boolean>(false);
  const statusRef = useRef<RefreshStatus>('idle');
  const pullDistanceRef = useRef<number>(0);

  statusRef.current = status;
  pullDistanceRef.current = pullDistance;

  // Helper to find the scrollable container (#main-content-scrollable)
  const getScrollParent = useCallback((): HTMLElement | null => {
    let el: HTMLElement | null = containerRef.current;
    while (el) {
      if (el.id === 'main-content-scrollable') {
        return el;
      }
      const overflowY = window.getComputedStyle(el).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return el;
      }
      el = el.parentElement;
    }
    return document.getElementById('main-content-scrollable') || document.documentElement;
  }, []);

  // Sync external isRefreshing state smoothly
  useEffect(() => {
    if (externalIsRefreshing !== undefined) {
      if (externalIsRefreshing && statusRef.current === 'idle') {
        setStatus('refreshing');
        setPullDistance(52);
      } else if (!externalIsRefreshing && statusRef.current === 'refreshing') {
        setStatus('completed');
        const timer = setTimeout(() => {
          setPullDistance(0);
          setTimeout(() => setStatus('idle'), 280);
        }, 220);
        return () => clearTimeout(timer);
      }
    }
  }, [externalIsRefreshing]);

  // Non-passive native touch event listeners for Capacitor / Android WebView smoothness
  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      // Ignore new pulls if already refreshing or completing
      if (
        statusRef.current === 'refreshing' ||
        statusRef.current === 'completed' ||
        statusRef.current === 'error'
      ) {
        return;
      }

      const scrollEl = getScrollParent();
      const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

      // Only enable pull if at the top
      if (scrollTop <= 1) {
        canPullRef.current = true;
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        setHasTriggeredHaptic(false);
      } else {
        canPullRef.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (
        !canPullRef.current ||
        statusRef.current === 'refreshing' ||
        statusRef.current === 'completed' ||
        statusRef.current === 'error'
      ) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY.current;
      const deltaX = currentX - touchStartX.current;

      const scrollEl = getScrollParent();
      const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

      if (scrollTop > 1) {
        canPullRef.current = false;
        setStatus('idle');
        setPullDistance(0);
        return;
      }

      // Ignore horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaY) < 12) {
        canPullRef.current = false;
        return;
      }

      // If user is pulling downwards from top
      if (deltaY > 0) {
        // Prevent default browser rubber-band conflict on WebView
        if (e.cancelable) {
          e.preventDefault();
        }

        // Apple logarithmic damping curve: highly direct initially, gentle resistance near threshold
        const damped = Math.min(deltaY * 0.46, maxPullDistance);
        const isReadyNow = damped >= threshold;

        setStatus(isReadyNow ? 'ready' : 'pulling');
        setPullDistance(damped);

        if (isReadyNow && !hasTriggeredHaptic) {
          setHasTriggeredHaptic(true);
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(12);
            }
          } catch {}
        } else if (!isReadyNow && hasTriggeredHaptic) {
          setHasTriggeredHaptic(false);
        }
      } else {
        setStatus('idle');
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (
        !canPullRef.current ||
        statusRef.current === 'refreshing' ||
        statusRef.current === 'completed' ||
        statusRef.current === 'error'
      ) {
        canPullRef.current = false;
        return;
      }

      canPullRef.current = false;

      if (pullDistanceRef.current >= threshold) {
        setStatus('refreshing');
        setPullDistance(52); // Resting height for indicator + translated content

        const startTime = Date.now();
        let isSuccess = true;

        try {
          await onRefresh();
        } catch (err) {
          console.error('PullToRefresh error:', err);
          isSuccess = false;
        }

        // Keep indicator visible for at least 380ms so the user perceives the refresh
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 380 - elapsed);

        setTimeout(() => {
          setStatus(isSuccess ? 'completed' : 'error');
          setTimeout(() => {
            setPullDistance(0);
            setTimeout(() => setStatus('idle'), 280);
          }, 200);
        }, delay);
      } else {
        // Released before threshold: spring back smoothly to 0
        setStatus('idle');
        setPullDistance(0);
      }
    };

    const onTouchCancel = () => {
      canPullRef.current = false;
      if (
        statusRef.current !== 'refreshing' &&
        statusRef.current !== 'completed' &&
        statusRef.current !== 'error'
      ) {
        setStatus('idle');
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [disabled, threshold, maxPullDistance, onRefresh, getScrollParent, hasTriggeredHaptic]);

  const progress = Math.min(pullDistance / threshold, 1);
  const isPulling = status === 'pulling' || status === 'ready';
  const isRefreshing = status === 'refreshing';
  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isVisible = pullDistance > 4 || isRefreshing || isCompleted || isError;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ touchAction: 'pan-x pan-down pan-up' }}
    >
      {/* ── Apple-Style Premium Floating Indicator Pill ── */}
      {isVisible && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex justify-center items-center"
          style={{
            transform: `translate3d(0, ${Math.max(pullDistance * 0.44 - 6, 8)}px, 0)`,
            opacity: isRefreshing || isCompleted || isError ? 1 : Math.min(pullDistance / 22, 1),
            transition: isPulling ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
          }}
        >
          <div
            className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500 text-white border border-emerald-400 scale-105 shadow-emerald-500/20'
                : isError
                ? 'bg-rose-500 text-white border border-rose-400 scale-105 shadow-rose-500/20'
                : status === 'ready' || isRefreshing
                ? 'bg-white/95 dark:bg-[#151D28]/95 backdrop-blur-xl border border-[var(--color-accent,#FF9B51)] text-[var(--color-accent,#FF9B51)] scale-105 shadow-lg shadow-[var(--color-accent,#FF9B51)]/15'
                : 'bg-white/95 dark:bg-[#151D28]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] text-slate-500 scale-95 shadow-sm'
            }`}
          >
            {isCompleted ? (
              <CheckIcon className="w-4 h-4 stroke-[3] animate-in zoom-in-50 duration-150" />
            ) : isError ? (
              <ExclamationTriangleIcon className="w-4 h-4 stroke-[2.5] animate-in zoom-in-50 duration-150" />
            ) : (
              <PremiumArrowCircle progress={progress} status={status} />
            )}
          </div>
        </div>
      )}

      {/* ── Dashboard Content Area — Translates physically in lockstep with the gesture ── */}
      <div
        style={{
          transform: pullDistance > 0 ? `translate3d(0, ${pullDistance}px, 0)` : 'translate3d(0, 0, 0)',
          transition: isPulling
            ? 'none'
            : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: isPulling || isRefreshing ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

