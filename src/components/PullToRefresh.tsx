import React, { useState, useRef, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
  isRefreshing?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 64,
  maxPullDistance = 96,
  className = '',
  isRefreshing: externalIsRefreshing,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [internalIsRefreshing, setInternalIsRefreshing] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const canPullRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);

  const isRefreshing = externalIsRefreshing !== undefined ? externalIsRefreshing : internalIsRefreshing;
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

      // Apply logarithmic / damped rubber-band physics
      const dampedDistance = Math.min(Math.pow(deltaY, 0.8) * 1.1, maxPullDistance);
      setPullDistance(dampedDistance);

      // Light haptic feedback on reaching the threshold
      if (dampedDistance >= threshold && !hasTriggeredHaptic) {
        setHasTriggeredHaptic(true);
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(15);
          }
        } catch {}
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
      setInternalIsRefreshing(true);
      setPullDistance(48); // Resting position for spinner & content

      try {
        await onRefresh();
      } catch (err) {
        console.error('Pull to refresh error:', err);
      } finally {
        // Smoothly return back to resting position
        setTimeout(() => {
          setInternalIsRefreshing(false);
          setPullDistance(0);
        }, 250);
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
  const iconRotation = isRefreshing ? 0 : progress * 360;

  // Active translation for content area
  const contentTranslateY = isRefreshing ? 48 : pullDistance;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`relative w-full ${className}`}
    >
      {/* ── Apple-Style Top Spinner Indicator ── */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center items-center overflow-hidden"
        style={{
          height: isRefreshing ? 48 : Math.max(pullDistance, 0),
          opacity: pullDistance > 8 || isRefreshing ? 1 : 0,
          transition: isPulling
            ? 'opacity 0.15s ease'
            : 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s ease',
        }}
      >
        <div
          className={`flex items-center justify-center rounded-full shadow-sm ${
            isRefreshing || isThresholdReached
              ? 'bg-white dark:bg-[#151D28] border border-[#FF9B51]/40 text-[#FF9B51]'
              : 'bg-white/90 dark:bg-[#1a2332]/90 border border-black/[0.08] dark:border-white/[0.1] text-[#8E8E93]'
          }`}
          style={{
            width: 32,
            height: 32,
            transform: `scale(${isRefreshing ? 1 : 0.75 + progress * 0.25})`,
            transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <ArrowPathIcon
            className={`w-4 h-4 stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${iconRotation}deg)`,
              transition: isPulling ? 'none' : 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* ── Content Area — Translates fluidly with gesture ── */}
      <div
        style={{
          transform: contentTranslateY > 0 ? `translate3d(0, ${contentTranslateY}px, 0)` : undefined,
          transition: isPulling
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: isPulling || isRefreshing ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};
