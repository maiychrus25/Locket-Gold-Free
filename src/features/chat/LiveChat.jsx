import React, { useState, useEffect } from "react";
import { getSessionGeneration, sanitize } from "../../lib/api.js";
import { Radio } from "lucide-react";
import { FriendSelect } from "../feed/FriendSelect.jsx";

export function LiveChat({ authenticated }) {
  const [userId, setUserId] = useState("");
  const [active, setActive] = useState("");
  const [status, setStatus] = useState("Chưa kết nối");
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (!active || !authenticated) return;
    let cancelled = false;
    const generation = getSessionGeneration();
    const stream = new EventSource(
      `/api/chat/events?otherUserId=${encodeURIComponent(active)}&generation=${encodeURIComponent(generation || "")}`,
      {
        withCredentials: true,
      },
    );
    stream.onopen = () => {
      if (!cancelled && getSessionGeneration() === generation) setStatus("Đang kết nối…");
      else stream.close();
    };
    stream.addEventListener("message", (event) => {
      if (cancelled || getSessionGeneration() !== generation) {
        stream.close();
        return;
      }
      try {
        const data = sanitize(JSON.parse(event.data));
        const text = data?.text || data?.message?.text || data?.message;
        if (typeof text === "string" && text.trim()) {
          setEvents(previous => [...previous.slice(-99), text]);
        } else {
          setStatus("Có cập nhật mới. Mở lịch sử trò chuyện để xem.");
        }
      } catch {
        setStatus("Chưa hiển thị được tin nhắn mới. Hãy mở lịch sử trò chuyện.");
      }
    });
    stream.addEventListener("status", (event) => {
      if (cancelled || getSessionGeneration() !== generation) {
        stream.close();
        return;
      }
      try {
        const data = JSON.parse(event.data);
        setStatus(
          {
            connecting: "Đang kết nối…",
            connected: "Đã kết nối",
            reconnecting: "Đang kết nối lại…",
          }[data.state] ||
            "Đang chờ tin nhắn mới",
        );
      } catch {
        setStatus("Đang chờ tin nhắn mới");
      }
    });
    stream.onerror = () => {
      if (cancelled || getSessionGeneration() !== generation) return;
      setStatus("Kết nối gián đoạn. Dừng và kết nối lại để tiếp tục.");
      stream.close();
    };
    return () => { cancelled = true; stream.close(); };
  }, [active, authenticated]);
  return (
    <section className="live-chat">
      <div className="section-heading">
        <h3>
          <Radio size={18} />
          Tin nhắn trực tiếp
        </h3>
        <span className="badge">{status}</span>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          setEvents([]);
          setStatus("Đang kết nối…");
          setActive(userId.trim());
        }}
      >
        <FriendSelect label="Người bạn trò chuyện trực tiếp" value={userId} onChange={setUserId} disabled={!authenticated || Boolean(active)} />
        <button
          className="button secondary"
          disabled={!authenticated || !userId || Boolean(active)}
        >
          Kết nối
        </button>
        {active && (
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setActive("");
              setStatus("Đã dừng");
            }}
          >
            Dừng
          </button>
        )}
      </form>
      {events.length > 0 ? (
        <div className="message-list" aria-live="polite">{events.map((text, index) => <article className="message" key={index}><p>{text}</p></article>)}</div>
      ) : (
        <p className="muted">
          Tin nhắn mới sẽ xuất hiện tại đây khi bạn bật trò chuyện trực tiếp.
        </p>
      )}
    </section>
  );
}
