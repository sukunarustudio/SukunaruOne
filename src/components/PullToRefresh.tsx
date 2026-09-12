import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
  isRefreshing?: boolean;
}

type RefreshStatus = 'idle' | 'pulling' | 'refreshing' | 'completed';

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 60,
  maxPullDistance = 110,
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

  // Helper to find the scrollable container
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

  // Sync external isRefreshing state safely
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
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [externalIsRefreshing]);

  // Non-passive native touch event listeners for Capacitor / Android WebView smoothness
  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (statusRef.current === 'refreshing' || statusRef.current === 'completed') return;

      const scrollEl = getScrollParent();
      const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

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
      if (!canPullRef.current || statusRef.current === 'refreshing' || statusRef.current === 'completed') return;

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

      // If user is pulling downwards
      if (deltaY > 0) {
        // Prevent default browser scroll conflict on WebView
        if (e.cancelable) {
          e.preventDefault();
        }

        // Apple rubber-band damping curve: fast response initially, graceful resistance at end
        const damped = Math.min(deltaY * 0.48, maxPullDistance);
        setStatus('pulling');
        setPullDistance(damped);

        if (damped >= threshold && !hasTriggeredHaptic) {
          setHasTriggeredHaptic(true);
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(15);
            }
          } catch {}
        } else if (damped < threshold && hasTriggeredHaptic) {
          setHasTriggeredHaptic(false);
        }
      } else {
        setStatus('idle');
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (!canPullRef.current || statusRef.current === 'refreshing' || statusRef.current === 'completed') {
        canPullRef.current = false;
        return;
      }

      canPullRef.current = false;

      if (pullDistanceRef.current >= threshold) {
        setStatus('refreshing');
        setPullDistance(52); // Resting position for refresh indicator & dashboard content

        const startTime = Date.now();
        try {
          await onRefresh();
        } catch (err) {
          console.error('PullToRefresh execution error:', err);
        }

        // Ensure minimum 350ms display so gesture feels intentional and stable
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 350 - elapsed);

        setTimeout(() => {
          setStatus('completed');
          setTimeout(() => {
            setPullDistance(0);
            setTimeout(() => setStatus('idle'), 280);
          }, 180);
        }, delay);
      } else {
        // Released before threshold: spring back to 0
        setStatus('idle');
        setPullDistance(0);
      }
    };

    const onTouchCancel = () => {
      canPullRef.current = false;
      if (statusRef.current !== 'refreshing' && statusRef.current !== 'completed') {
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
  const isThresholdReached = pullDistance >= threshold;
  const isPulling = status === 'pulling';
  const isRefreshing = status === 'refreshing';
  const isCompleted = status === 'completed';

  // Rotation while dragging
  const iconRotation = isRefreshing ? 0 : progress * 360;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ touchAction: 'pan-x pan-down pan-up' }}
    >
      {/* ── Apple-Style Top Floating Indicator ── */}
      {(pullDistance > 4 || isRefreshing || isCompleted) && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex justify-center items-center"
          style={{
            transform: `translate3d(0, ${Math.max(pullDistance * 0.45 - 6, 8)}px, 0)`,
            opacity: isRefreshing || isCompleted ? 1 : Math.min(pullDistance / 20, 1),
            transition: isPulling ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
          }}
        >
          <div
            className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500 text-white border border-emerald-400 scale-105 shadow-emerald-500/20'
                : isRefreshing || isThresholdReached
                ? 'bg-white dark:bg-[#151D28] border border-[var(--color-accent,#FF6A00)] text-[var(--color-accent,#FF6A00)] scale-105 shadow-lg'
                : 'bg-white/95 dark:bg-[#1a2332]/95 border border-black/10 dark:border-white/10 text-slate-500 scale-95'
            }`}
          >
            {isCompleted ? (
              <CheckIcon className="w-4 h-4 stroke-[3] animate-in zoom-in-50 duration-150" />
            ) : (
              <ArrowPathIcon
                className={`w-4 h-4 stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`}
                style={{
                  transform: isRefreshing ? undefined : `rotate(${iconRotation}deg)`,
                  transition: isPulling ? 'none' : 'transform 0.2s ease',
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Dashboard Content Area — Translates smoothly with gesture ── */}
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
