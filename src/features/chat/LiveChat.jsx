import React, { useState, useEffect } from "react";
import { getSessionGeneration, sanitize } from "../../lib/api.js";
import { Radio } from "lucide-react";
import { Result } from "../../components/Result.jsx";

export function LiveChat({ authenticated }) {
  const [userId, setUserId] = useState("");
  const [active, setActive] = useState("");
  const [status, setStatus] = useState("Chưa kết nối");
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (!active || !authenticated) return;
    const generation = getSessionGeneration();
    const stream = new EventSource(
      `/api/chat/events?otherUserId=${encodeURIComponent(active)}&generation=${encodeURIComponent(generation || "")}`,
      {
        withCredentials: true,
      },
    );
    stream.onopen = () => {
      if (getSessionGeneration() === generation) setStatus("Đang kết nối…");
      else stream.close();
    };
    stream.addEventListener("message", (event) => {
      if (getSessionGeneration() !== generation) {
        stream.close();
        return;
      }
      try {
        setEvents((previous) => [
          ...previous.slice(-99),
          sanitize(JSON.parse(event.data)),
        ]);
      } catch {
        setStatus("Nhận được dữ liệu không hợp lệ");
      }
    });
    stream.addEventListener("status", (event) => {
      if (getSessionGeneration() !== generation) {
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
            (typeof data.status === "string"
              ? data.status
              : "Đã nhận trạng thái kết nối"),
        );
      } catch {
        setStatus("Đã nhận trạng thái kết nối");
      }
    });
    stream.onerror = () => {
      setStatus("Kết nối gián đoạn. Dừng và kết nối lại để tiếp tục.");
      stream.close();
    };
    return () => stream.close();
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
        <input
          aria-label="UID người trò chuyện"
          required
          placeholder="UID người bạn muốn trò chuyện"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          disabled={Boolean(active)}
        />
        <button
          className="button secondary"
          disabled={!authenticated || Boolean(active)}
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
        <Result value={events} />
      ) : (
        <p className="muted">
          Tin nhắn mới sẽ xuất hiện tại đây khi luồng trực tiếp được kết nối.
        </p>
      )}
    </section>
  );
}
