import React from "react";
import { useOperation } from "../../lib/useOperation.js";
import { useState, useRef, useEffect } from "react";
import { request, records, safeUrl } from "../../lib/api.js";
import { unwrap, postId, imageUrl, identity, personName } from "../../lib/data.js";
import { RefreshCw, Search, Heart, Eye, Trash2, Send } from "lucide-react";
import { Feedback } from "../../components/Feedback.jsx";
import { Details } from "../../components/Details.jsx";

export function FeedPanel({ tab, confirmAction, userUid }) {
  const state = useOperation();
  const [payload, setPayload] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [comment, setComment] = useState({});
  const [cursor, setCursor] = useState("");
  const [filter, setFilter] = useState("");
  const filterRevision = useRef(0);
  async function load(next = false) {
    const revision = filterRevision.current;
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
        : {},
    );
    if (result && revision === filterRevision.current) {
      setPayload(result.value);
      setLoaded(true);
      setCursor(
        result.value?.nextPageToken ||
          result.value?.next_page_token ||
          result.value?.pageToken ||
          "",
      );
    }
  }
  const reportError = state.setError;
  useEffect(() => {
    let cancelled = false;
    const revision = filterRevision.current;
    request(
      `/api/operations/moments/${tab === "history" ? "getMoments" : "getLatest"}`,
      tab === "history"
        ? {
            limit: 20,
            ...(userUid ? { filteredByUserId: userUid } : {}),
          }
        : {},
    )
      .then((response) => {
        if (!cancelled && revision === filterRevision.current) {
          const value = unwrap(response);
          setPayload(value);
          setLoaded(true);
          setCursor(
            value?.nextPageToken ||
              value?.next_page_token ||
              value?.pageToken ||
              "",
          );
        }
      })
      .catch((error) => {
        if (!cancelled) reportError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, reportError, userUid]);
  async function action(method, values) {
    const result = await state.run("moments", method, values);
    if (result) {
      state.setNotice("Máy chủ đã xác nhận thao tác.");
      if (method === "delete") await load();
    }
  }
  const items = records(payload);
  return (
    <div>
      <div className="daily-toolbar">
        <h3>
          {tab === "history" ? "Khoảnh khắc đã lưu" : "Khoảnh khắc mới nhất"}
        </h3>
        <button
          className="button secondary"
          disabled={state.pending}
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
          <input
            aria-label="Lọc bảng tin theo UID"
            placeholder="Lọc theo UID (không bắt buộc)"
            value={filter}
            disabled={state.pending}
            onChange={(event) => {
              filterRevision.current++;
              setFilter(event.target.value);
              setCursor("");
            }}
          />
          <button className="button secondary" disabled={state.pending}>
            <Search size={16} />
            Lọc
          </button>
        </form>
      )}
      <Feedback state={state} />
      {!loaded && state.pending && (
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
      <div className="daily-grid">
        {items.map((item, index) => {
          const id = postId(item);
          const video = safeUrl(
            item.video_url || item.videoUrl || item.video?.url,
          );
          const image = imageUrl(item);
          const author =
            item.user ||
            item.author ||
            (tab !== "history"
              ? item.sender ||
                item.owner || { uid: item.user_uid || item.userUid }
              : item.authorVerified === true
                ? { uid: item.user_uid || item.userUid }
                : null);
          const authorUid = identity(author);
          return (
            <article className="moment-card" key={id || index}>
              {video ? (
                <video controls preload="metadata" src={video} poster={image} />
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
                <h3>{personName(author)}</h3>
                {typeof item.caption === "string" && <p>{item.caption}</p>}
                <div className="action-row">
                  <button
                    className="button secondary"
                    disabled={state.pending || !id}
                    onClick={() =>
                      action("react", {
                        momentUid: id,
                        reaction: "❤️",
                        fromMemory: tab === "history",
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
                        fromMemory: tab === "history",
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
                <Details value={item} />
              </div>
            </article>
          );
        })}
      </div>
      {cursor && (
        <button
          className="button secondary"
          disabled={state.pending}
          onClick={() => load(true)}
        >
          Trang tiếp theo
        </button>
      )}
      {payload !== null && <Details value={payload} />}
    </div>
  );
}
