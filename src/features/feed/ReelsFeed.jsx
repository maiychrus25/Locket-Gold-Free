import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export function ReelsFeed({ children, pageToken, busy, loadMore }) {
  const track = useRef(null);
  const advance = useRef(null);
  const requestedPage = useRef(null);
  const scrollIntent = useRef(false);
  const touchStart = useRef(null);
  const [active, setActive] = useState(0);
  const count = React.Children.count(children);
  const hasMore = Boolean(pageToken);
  const move = (index) => {
    if (index >= count) {
      if (hasMore && !busy) {
        scrollIntent.current = false;
        advance.current = count;
        loadMore();
      }
      return;
    }
    track.current?.scrollTo({ top: Math.max(0, index) * track.current.clientHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  useEffect(() => {
    if (advance.current !== null && count > advance.current) {
      track.current?.scrollTo({ top: advance.current * track.current.clientHeight });
      advance.current = null;
    }
  }, [count]);
  useEffect(() => {
    const videos = [...track.current.querySelectorAll("video")];
    const activeCard = track.current.querySelectorAll(".moment-card")[active];
    const visible = new Set();
    const update = () => {
      for (const video of videos) {
        if (visible.has(video) && video.closest(".moment-card") === activeCard && document.visibilityState === "visible") video.play().catch(() => {});
        else video.pause();
      }
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    }, { threshold: [0, 0.6] });
    videos.forEach(video => observer.observe(video));
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      videos.forEach(video => video.pause());
    };
  }, [count, active]);
  return <div className="reels-viewer">
    <div className="reels-navigation">
      <span className="reels-hint">Vuốt lên để xem tiếp</span>
      <span role="status" aria-live="polite">{Math.min(active + 1, count)} / {count}</span>
      <button className="icon-button" aria-label="Khoảnh khắc trước" disabled={active === 0} onClick={() => move(active - 1)}><ArrowUp size={18} /></button>
      <button className="icon-button" aria-label="Khoảnh khắc tiếp theo" disabled={busy || (active >= count - 1 && !hasMore)} onClick={() => move(active + 1)}><ArrowDown size={18} /></button>
    </div>
    <div ref={track} className="reels-track" role="region" aria-label="Lướt khoảnh khắc bạn bè" tabIndex={0}
      onWheel={event => {
        if (event.target.closest(".moment-body")) return;
        scrollIntent.current = true;
        const el = event.currentTarget;
        if (event.deltaY > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 24 && requestedPage.current !== pageToken && hasMore && !busy) {
          requestedPage.current = pageToken;
          move(count);
        }
      }}
      onTouchStart={event => { touchStart.current = event.target.closest(".moment-body") ? null : event.touches[0]?.clientY; }}
      onTouchMove={event => { if (!event.target.closest(".moment-body")) scrollIntent.current = true; }}
      onTouchEnd={event => {
        const el = event.currentTarget;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24 && touchStart.current !== null && touchStart.current - event.changedTouches[0]?.clientY > 40 && hasMore && !busy && requestedPage.current !== pageToken) {
          requestedPage.current = pageToken;
          move(count);
        }
        touchStart.current = null;
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        move(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : active + (["ArrowDown", "PageDown"].includes(event.key) ? 1 : -1));
      }}
      onScroll={event => {
        const el = event.currentTarget;
        setActive(Math.max(0, Math.min(count - 1, Math.round(el.scrollTop / el.clientHeight))));
        if (scrollIntent.current && hasMore && !busy && el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 24 && requestedPage.current !== pageToken) {
          requestedPage.current = pageToken;
          scrollIntent.current = false;
          loadMore();
        }
      }}>
      {children}
    </div>
    <div className="reels-end">
        {hasMore ? <button className="button secondary" aria-label="Tải thêm khoảnh khắc" disabled={busy} onClick={loadMore}>{busy ? "Đang tải…" : "Tải thêm khoảnh khắc"}</button>
          : <p className="muted">Bạn đã xem hết các khoảnh khắc đã tải.</p>}
    </div>
  </div>;
}
