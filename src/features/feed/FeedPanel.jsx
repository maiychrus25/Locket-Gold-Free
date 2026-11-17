import React from "react";
import { useOperation } from "../../lib/useOperation.js";
import { useState, useRef, useEffect } from "react";
import { request, records, safeUrl } from "../../lib/api.js";
import { unwrap, postId, imageUrl, identity } from "../../lib/data.js";
import { RefreshCw, Search, Heart, Eye, Trash2, Send } from "lucide-react";
import { Feedback } from "../../components/Feedback.jsx";
import { momentDate, localDate, momentAuthor, feedPage } from "../../lib/memories.js";
import { ViewsDialog } from "./ViewsDialog.jsx";
import { FriendSelect, friendName } from "./FriendSelect.jsx";
import { ReelsFeed } from "./ReelsFeed.jsx";

export function FeedPanel({ tab, confirmAction, userUid }) {
  const state = useOperation();
  const [payload, setPayload] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [comment, setComment] = useState({});
  const [cursor, setCursor] = useState("");
  const [filter, setFilter] = useState("");
  const [layout, setLayout] = useState(tab === "history" ? "grid" : "reels");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [reactions, setReactions] = useState({});
  const [viewing, setViewing] = useState(null);
  const [profiles, setProfiles] = useState(() => new Map());
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [fromHistory, setFromHistory] = useState(false);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [viewerRevision, setViewerRevision] = useState(0);
  const pageBusy = useRef(true);
  const filterRevision = useRef(0);
  async function load(next = false) {
    if (pageBusy.current) return;
    pageBusy.current = true;
    setLoadingPage(true);
    if (!next) setProfilesLoaded(false);
    const revision = ++filterRevision.current;
    const result = await state.run(
      "moments",
      tab === "history" ? "getMoments" : "getLatest",
      tab === "history"
        ? {
            limit: 20,
            ...(filter || userUid
              ? {
                  filteredByUserId: filter || userUid,
                }
              : {}),
            ...(next && cursor
              ? {
                  pageToken: cursor,
                }
              : {}),
          }
        : { includeHistory: true, ...(next && cursor ? { pageToken: cursor } : {}) },
    );
    if (result && revision === filterRevision.current) {
      const page = tab === "history" ? null : feedPage(next ? records(payload) : [], records(result.value), next ? cursor : "", Array.isArray(result.value) ? undefined : result.value?.nextPageToken || null);
      setFromHistory(tab === "history" || (!Array.isArray(result.value) && !result.value?.historyUnavailable));
      setHistoryUnavailable(Boolean(result.value?.historyUnavailable));
      if (!next) setViewerRevision(previous => previous + 1);
      setPayload(page ? page.moments : result.value);
      setLoaded(true);
      setCursor(
        page ? page.cursor : result.value?.nextPageToken ||
          result.value?.next_page_token ||
          result.value?.pageToken ||
          "",
      );
    }
    if (revision === filterRevision.current) {
      pageBusy.current = false;
      setLoadingPage(false);
    }
  }
  const reportError = state.setError;
  useEffect(() => {
    let cancelled = false;
    const revision = ++filterRevision.current;
    pageBusy.current = true;
    setLoadingPage(true);
    request(
      `/api/operations/moments/${tab === "history" ? "getMoments" : "getLatest"}`,
      tab === "history"
        ? {
            limit: 20,
            ...(userUid ? { filteredByUserId: userUid } : {}),
          }
        : { includeHistory: true },
    )
      .then((response) => {
        if (!cancelled && revision === filterRevision.current) {
          const value = unwrap(response);
          const page = tab === "history" ? null : feedPage([], records(value), "", Array.isArray(value) ? undefined : value?.nextPageToken || null);
          setFromHistory(tab === "history" || (!Array.isArray(value) && !value?.historyUnavailable));
          setHistoryUnavailable(Boolean(value?.historyUnavailable));
          setPayload(page ? page.moments : value);
          setLoaded(true);
          setCursor(
            page ? page.cursor : value?.nextPageToken ||
              value?.next_page_token ||
              value?.pageToken ||
              "",
          );
        }
      })
      .catch((error) => {
        if (!cancelled && revision === filterRevision.current) reportError(error.message);
      })
      .finally(() => {
        if (!cancelled && revision === filterRevision.current) {
          pageBusy.current = false;
          setLoadingPage(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, reportError, userUid]);
  const needsProfiles = loaded && records(payload).some(item => {
    const author = momentAuthor(item, tab === "history");
    const uid = identity(author);
    return uid && friendName(author) === "Bạn bè" && !profiles.has(uid);
  });
  useEffect(() => {
    if (!needsProfiles || profilesLoaded) return;
    let cancelled = false;
    Promise.allSettled([
      request("/api/operations/friends/getAllFriends", {}),
      request("/api/operations/user/getProfile", {}),
    ]).then(([friends, self]) => {
      if (cancelled) return;
      const people = friends.status === "fulfilled" ? records(friends.value).map(person => person.user || person) : [];
      if (self.status === "fulfilled") {
        const value = unwrap(self.value);
        const person = value?.user || value;
        if (person && typeof person === "object" && !Array.isArray(person)) people.push({ ...person, uid: userUid });
      }
      setProfiles(previous => new Map([...previous, ...people.filter(person => identity(person) && friendName(person) !== "Bạn bè").map(person => [identity(person), person])]));
      setProfilesLoaded(true);
    });
    return () => { cancelled = true; };
  }, [needsProfiles, profilesLoaded, userUid]);
  async function action(method, values) {
    const result = await state.run("moments", method, values);
    if (result) {
      state.setNotice("Đã cập nhật khoảnh khắc.");
      if (method === "delete") await load();
    }
  }
  const items = records(payload).filter(item => {
    if (tab !== "history" || (!month && !day)) return true;
    const date = momentDate(item);
    if (!date) return false;
    const key = localDate(date);
    return (!month || key.startsWith(month)) && (!day || key === day);
  });
  return (
    <div>
      <div className="daily-toolbar">
        <h3>
          {tab === "history" ? "Khoảnh khắc đã lưu" : "Khoảnh khắc mới nhất"}
        </h3>
        <button
          className="button secondary"
          disabled={state.pending || loadingPage}
          onClick={() => load()}
        >
          <RefreshCw size={15} />
          Tải lại
        </button>
      </div>
      {tab === "history" && (
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
        >
          <FriendSelect label="Khoảnh khắc của" emptyLabel="Của tôi" value={filter} disabled={state.pending || loadingPage}
            onChange={value => {
              filterRevision.current++;
              setFilter(value);
              setCursor("");
            }} />
          <button className="button secondary" disabled={state.pending || loadingPage}>
            <Search size={16} />
            Lọc
          </button>
        </form>
      )}
      <div className="memory-controls" aria-label="Cách hiển thị">
        {tab !== "history" && <button className="button secondary" aria-pressed={layout === "reels"} onClick={() => setLayout("reels")}>Lướt từng tin</button>}
        <button className="button secondary" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>Dạng lưới</button>
        <button className="button secondary" aria-pressed={layout === "list"} onClick={() => setLayout("list")}>Dạng danh sách</button>
      </div>
      {tab === "history" && <div className="memory-filters">
        <label>Tháng kỷ niệm<input type="month" value={month} onChange={event => { setMonth(event.target.value); setDay(""); }} /></label>
        <label>Ngày kỷ niệm<input type="date" value={day} onChange={event => { setDay(event.target.value); setMonth(""); }} /></label>
        <button className="button secondary" onClick={() => { setDay(""); setMonth(""); }}>Xoá bộ lọc ngày</button>
        <p className="muted">Chỉ lọc các khoảnh khắc trên trang đã tải, không phải toàn bộ lịch sử. Ngày hiển thị theo múi giờ thiết bị.</p>
      </div>}
      <Feedback state={{ ...state, error: state.error ? "Chưa hoàn tất yêu cầu. Hãy kiểm tra lại trước khi thử lại." : "" }} />
      {historyUnavailable && <p role="status" className="muted">Hiện chỉ tải được tin mới nhất. Các khoảnh khắc cũ chưa tải được; bạn bấm Tải lại để thử lại nhé.</p>}
      {!loaded && !state.error && (
        <p role="status" className="muted">
          Đang tải khoảnh khắc…
        </p>
      )}
      {loaded && !items.length && (
        <div className="empty">
          <Heart size={30} />
          <h3>Chưa có khoảnh khắc để hiển thị</h3>
          <p>Khoảnh khắc được chia sẻ sẽ xuất hiện tại đây.</p>
        </div>
      )}
      <div className={`memory-layout memory-${layout} ${layout === "reels" ? "" : "daily-grid"}`}>
        {layout === "reels" && items.length ? <ReelsFeed key={viewerRevision} pageToken={cursor} busy={state.pending || loadingPage} loadMore={() => load(true)}>
          {renderCards()}
        </ReelsFeed> : renderCards()}
      </div>
      {cursor && layout !== "reels" && (
        <button className="button secondary" disabled={state.pending || loadingPage} onClick={() => load(true)}>
          {tab === "history" ? "Trang tiếp theo" : "Tải thêm khoảnh khắc"}
        </button>
      )}
      {viewing && <ViewsDialog key={viewing} momentUid={viewing} close={() => setViewing(null)} />}
    </div>
  );
  function renderCards() {
    return items.map((item, index) => {
          const id = postId(item);
          const date = momentDate(item);
          const video = safeUrl(
            item.video_url || item.videoUrl || item.video?.url,
          );
          const image = imageUrl(item);
          const author = momentAuthor(item, tab === "history");
          const authorUid = identity(author);
          const person = friendName(author) !== "Bạn bè" ? author : profiles.get(authorUid);
          const name = friendName(person);
          return (
            <article className="moment-card" key={id || index}>
              {video ? (
                <video controls playsInline loop={layout === "reels"} muted={layout === "reels"} preload="metadata" src={video} poster={image} />
              ) : image ? (
                <img
                  src={image}
                  alt={
                    typeof item.caption === "string"
                      ? item.caption
                      : "Khoảnh khắc được chia sẻ"
                  }
                  loading="lazy"
                />
              ) : null}
              <div className="moment-body">
                <h3>{name !== "Bạn bè" ? name : authorUid && authorUid === userUid ? "Bạn" : "Chưa rõ người đăng"}</h3>
                {date ? <time className="muted" dateTime={date.toISOString()}>{date.toLocaleString("vi-VN")}</time> : <small className="muted">Chưa rõ thời gian</small>}
                {typeof item.caption === "string" && <p>{item.caption}</p>}
                <div className="action-row">
                  <button
                    className="button secondary"
                    disabled={state.pending || !id}
                    onClick={() =>
                      action("react", {
                        momentUid: id,
                        reaction: "❤️",
                        fromMemory: tab === "history" || fromHistory,
                      })
                    }
                  >
                    <Heart size={14} />
                    Thả tim
                  </button>
                  <button
                    className="button secondary"
                    disabled={state.pending || !id}
                    onClick={() =>
                      action("markAsViewed", {
                        momentUid: id,
                      })
                    }
                  >
                    <Eye size={14} />
                    Đã xem
                  </button>
                  <select aria-label="Chọn cảm xúc" value={reactions[id] || "❤️"} onChange={event => setReactions(previous => ({ ...previous, [id]: event.target.value }))}>
                    {["❤️", "😂", "🥰", "🔥", "👏", "😮"].map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                  </select>
                  <button className="button secondary" disabled={state.pending || !id} onClick={() => action("react", { momentUid: id, reaction: reactions[id] || "❤️", fromMemory: tab === "history" || fromHistory })}>Gửi cảm xúc</button>
                  <button className="button secondary" disabled={!id} onClick={() => setViewing(id)}>Xem lượt xem</button>
                  {tab === "history" && authorUid && authorUid === userUid && (
                    <button
                      className="button secondary"
                      disabled={state.pending || !id}
                      onClick={() =>
                        confirmAction("Xoá khoảnh khắc này?", () =>
                          action("delete", {
                            momentUid: id,
                          }),
                        )
                      }
                    >
                      <Trash2 size={14} />
                      Xoá
                    </button>
                  )}
                </div>
                {authorUid && (
                  <form
                    className="inline-form"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const result = await state.run("moments", "comment", {
                        momentUid: id,
                        receiverUid: authorUid,
                        text: comment[id],
                        fromMemory: tab === "history" || fromHistory,
                      });
                      if (result) {
                        setComment((previous) => ({
                          ...previous,
                          [id]: "",
                        }));
                        state.setNotice("Đã gửi bình luận.");
                      }
                    }}
                  >
                    <input
                      aria-label="Bình luận khoảnh khắc"
                      placeholder="Gửi một lời nhắn…"
                      required
                      value={comment[id] || ""}
                      onChange={(event) =>
                        setComment((previous) => ({
                          ...previous,
                          [id]: event.target.value,
                        }))
                      }
                    />
                    <button
                      className="button secondary"
                      disabled={state.pending || !id}
                      aria-label="Gửi bình luận"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        });
  }
}
