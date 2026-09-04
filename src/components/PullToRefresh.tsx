import React, { useState, useRef, useCallback } from 'react';
import { ArrowPathIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 60,
  maxPullDistance = 95,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const canPullRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);

  isRefreshingRef.current = isRefreshing;

  // Helper to find the nearest scrollable parent element
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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshingRef.current) return;

    const scrollEl = getScrollParent();
    const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

    // Only allow pull-to-refresh if user is at the very top of the scroll container
    if (scrollTop <= 1) {
      canPullRef.current = true;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      setHasTriggeredHaptic(false);
    } else {
      canPullRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshingRef.current || !canPullRef.current) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - touchStartY.current;
    const deltaX = currentX - touchStartX.current;

    // Check if user has scrolled down while dragging
    const scrollEl = getScrollParent();
    const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;
    if (scrollTop > 1) {
      canPullRef.current = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    // Cancel if horizontal swipe dominates (e.g. carousel or swipe gestures)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaY) < 15) {
      canPullRef.current = false;
      return;
    }

    // If pulling downwards from top
    if (deltaY > 0) {
      setIsPulling(true);

      // Apply rubber-band damping physics formula
      const dampedDistance = Math.min(Math.pow(deltaY, 0.85) * 1.5, maxPullDistance);
      setPullDistance(dampedDistance);

      // Light haptic feedback on reaching the threshold
      if (dampedDistance >= threshold && !hasTriggeredHaptic) {
        setHasTriggeredHaptic(true);
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(18);
          }
        } catch {
          // Ignore vibration error if not supported
        }
      } else if (dampedDistance < threshold && hasTriggeredHaptic) {
        setHasTriggeredHaptic(false);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshingRef.current || !canPullRef.current) {
      canPullRef.current = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    canPullRef.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(48); // Fixed comfortable resting height while refreshing

      try {
        await onRefresh();
      } catch (err) {
        console.error('Pull to refresh error:', err);
      } finally {
        // Smoothly close the refresh indicator
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      // Released before threshold: spring back to 0
      setPullDistance(0);
    }
  };

  const handleTouchCancel = () => {
    canPullRef.current = false;
    setIsPulling(false);
    if (!isRefreshing) {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / threshold, 1);
  const isThresholdReached = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`relative w-full ${className}`}
    >
      {/* ── Pull to Refresh Indicator ── */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-center overflow-hidden"
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 48 : 0)}px`,
          opacity: pullDistance > 8 || isRefreshing ? 1 : 0,
          transition: isPulling ? 'none' : 'height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease',
        }}
      >
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#151D28] border border-[#BFC9D1]/40 dark:border-slate-700 shadow-md shadow-black/10"
          style={{
            transform: `scale(${0.75 + progress * 0.25})`,
            transition: isPulling ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {isRefreshing ? (
            <>
              <ArrowPathIcon
                className="w-4 h-4 animate-spin stroke-[2.5]"
                style={{ color: 'var(--color-accent)' }}
              />
              <span className="text-[11.5px] font-bold text-[#25343F] dark:text-white tracking-tight">
                Memperbarui data...
              </span>
            </>
          ) : (
            <>
              <div
                className="w-4 h-4 flex items-center justify-center transition-transform duration-200"
                style={{
                  transform: `rotate(${isThresholdReached ? 180 : progress * 180}deg)`,
                  color: isThresholdReached ? 'var(--color-accent)' : '#898989',
                }}
              >
                <ArrowDownIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight transition-colors ${
                  isThresholdReached
                    ? 'text-[var(--color-accent)]'
                    : 'text-[#898989] dark:text-slate-400'
                }`}
              >
                {isThresholdReached ? 'Lepaskan untuk memuat ulang' : 'Tarik ke bawah...'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content Area with Elastic Pull Translation ── */}
      <div
        style={{
          transform: pullDistance > 0 ? `translate3d(0, ${pullDistance * 0.55}px, 0)` : undefined,
          transition: isPulling ? 'none' : pullDistance > 0 ? 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)' : undefined,
          willChange: isPulling ? 'transform' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
