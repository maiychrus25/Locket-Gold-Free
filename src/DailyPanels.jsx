import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Heart,
  Users,
  MessageCircle,
  Send,
  UserPlus,
  Check,
  Trash2,
  Eye,
  Search,
} from "lucide-react";
import { request, records, safeUrl, sanitize } from "./api.js";
const unwrap = (value) => value?.data ?? value;
const identity = (value) =>
  (typeof value === "string" ? value : "") ||
  value?.uid ||
  value?.user_uid ||
  value?.userUid ||
  value?.id ||
  value?.user?.uid ||
  value?.sender?.uid ||
  "";
const personName = (value) =>
  value?.displayName ||
  value?.display_name ||
  value?.username ||
  [value?.first_name || value?.firstName, value?.last_name || value?.lastName]
    .filter(Boolean)
    .join(" ") ||
  identity(value) ||
  "Người dùng";
const imageUrl = (value) =>
  safeUrl(
    value?.thumbnail_url ||
      value?.thumbnailUrl ||
      value?.image_url ||
      value?.imageUrl ||
      value?.photoURL ||
      value?.profile_picture_url ||
      value?.avatar_url ||
      value?.user?.profile_picture_url ||
      value?.image?.url ||
      value?.image,
  );
const postId = (value) =>
  value?.canonical_uid ||
  value?.uid ||
  value?.id ||
  value?.moment_uid ||
  value?.momentUid;
function Details({ value }) {
  return (
    <details className="raw">
      <summary>Chi tiết dữ liệu</summary>
      <pre>{JSON.stringify(sanitize(value), null, 2)}</pre>
    </details>
  );
}
function useOperation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function run(group, method, values = {}) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const value = unwrap(
        await request(`/api/operations/${group}/${method}`, values),
      );
      return {
        value,
      };
    } catch (failure) {
      setError(failure.message);
      return null;
    } finally {
      setPending(false);
    }
  }
  return {
    run,
    pending,
    error,
    notice,
    setNotice,
    setError,
  };
}
function Feedback({ state }) {
  return (
    <>
      {state.error && (
        <p className="error daily-error" role="alert">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p className="notice" role="status">
          {state.notice}
        </p>
      )}
    </>
  );
}
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
export function FriendsPanel({ confirmAction }) {
  const state = useOperation();
  const [tab, setTab] = useState("getAllFriends");
  const [payload, setPayload] = useState(null);
  const [username, setUsername] = useState("");
  const [lookup, setLookup] = useState(null);
  async function load(method = tab) {
    const result = await state.run("friends", method);
    if (result) setPayload(result.value);
  }
  const reportError = state.setError;
  useEffect(() => {
    let cancelled = false;
    request(`/api/operations/friends/${tab}`, {})
      .then((response) => {
        if (!cancelled) setPayload(unwrap(response));
      })
      .catch((error) => {
        if (!cancelled) reportError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, reportError]);
  async function action(method, userUid) {
    const result = await state.run("friends", method, {
      userUid,
    });
    if (result) {
      await load();
      state.setNotice("Máy chủ đã xác nhận thao tác bạn bè.");
    }
  }
  let people = records(payload);
  if (!people.length && payload && typeof payload === "object")
    people = [
      "incoming",
      "outgoing",
      "incoming_requests",
      "outgoing_requests",
      "received",
      "sent",
    ].flatMap((key) =>
      Array.isArray(payload[key])
        ? payload[key].map((person) => ({
            ...person,
            requestDirection: key,
          }))
        : [],
    );
  return (
    <>
      <form
        className="inline-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await state.run("user", "getProfileByUsername", {
            username,
          });
          if (result) setLookup(result.value?.user || result.value);
        }}
      >
        <input
          aria-label="Tìm bạn bằng username"
          placeholder="Tìm bạn bằng username"
          value={username}
          required
          disabled={state.pending}
          onChange={(event) => {
            setUsername(event.target.value);
            setLookup(null);
          }}
        />
        <button className="button primary" disabled={state.pending}>
          <Search size={16} />
          Tìm bạn
        </button>
      </form>
      {lookup && (
        <div className="person-card">
          <h3>{personName(lookup)}</h3>
          <button
            className="button secondary"
            disabled={state.pending || !lookup.uid}
            onClick={async () => {
              const result = await state.run("friends", "sendRequest", {
                userUid: lookup.uid,
              });
              if (result) state.setNotice("Đã gửi lời mời kết bạn.");
            }}
          >
            <UserPlus size={15} />
            Gửi lời mời
          </button>
          <Details value={lookup} />
        </div>
      )}
      <div className="tabs" aria-label="Danh sách bạn bè">
        {[
          ["getAllFriends", "Bạn bè"],
          ["getFriendRequests", "Lời mời"],
          ["getGroupsAndFriends", "Nhóm"],
        ].map(([method, label]) => (
          <button
            key={method}
            disabled={state.pending}
            className={method === tab ? "selected" : ""}
            onClick={() => {
              setPayload(null);
              setTab(method);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Feedback state={state} />
      <div className="daily-toolbar">
        <h3>
          {people.length
            ? `${people.length} mục được trả về`
            : "Vòng tròn của bạn"}
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
      {payload !== null && !people.length && (
        <div className="empty">
          <Users size={30} />
          <h3>Chưa có mục nào để hiển thị</h3>
          <p>Tìm bạn mới hoặc kiểm tra dữ liệu nhóm bên dưới.</p>
        </div>
      )}
      <div className="people-list">
        {people.map((person, index) => {
          const user = person.user || person;
          const uid = identity(user);
          const avatar = imageUrl(user);
          return (
            <article className="person-card" key={uid || index}>
              <div className="person-heading">
                {avatar ? <img src={avatar} alt="" /> : <Users size={25} />}
                <div>
                  <strong>{personName(user)}</strong>
                  <small>
                    {{
                      incoming: "Lời mời đến",
                      outgoing: "Lời mời đã gửi",
                      received: "Lời mời đến",
                      sent: "Lời mời đã gửi",
                    }[person.requestDirection] ||
                      person.requestDirection ||
                      uid}
                  </small>
                </div>
              </div>
              <div className="action-row">
                {tab === "getFriendRequests" ? (
                  <button
                    className="button primary"
                    disabled={
                      state.pending ||
                      !uid ||
                      /outgoing|sent/.test(person.requestDirection || "")
                    }
                    onClick={() => action("acceptRequest", uid)}
                  >
                    <Check size={14} />
                    Chấp nhận
                  </button>
                ) : (
                  <button
                    className="button secondary"
                    disabled={state.pending || !uid}
                    onClick={() =>
                      confirmAction("Huỷ kết bạn với người này?", () =>
                        action("remove", uid),
                      )
                    }
                  >
                    Huỷ kết bạn
                  </button>
                )}
                <button
                  className="button secondary"
                  disabled={state.pending || !uid}
                  onClick={() =>
                    confirmAction("Chặn người dùng này?", () =>
                      action("block", uid),
                    )
                  }
                >
                  Chặn
                </button>
                <button
                  className="button secondary"
                  disabled={state.pending || !uid}
                  onClick={() => action("unblock", uid)}
                >
                  Bỏ chặn
                </button>
              </div>
              <Details value={person} />
            </article>
          );
        })}
      </div>
      {payload !== null && <Details value={payload} />}
    </>
  );
}
export function ChatPanel({ confirmAction }) {
  const state = useOperation();
  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState(null);
  const [otherUserId, setOtherUserId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [text, setText] = useState("");
  const [momentUid, setMomentUid] = useState("");
  async function loadConversations() {
    const result = await state.run("chat", "getConversations");
    if (result) setConversations(result.value);
  }
  const reportError = state.setError;
  useEffect(() => {
    let cancelled = false;
    request("/api/operations/chat/getConversations", {})
      .then((response) => {
        if (!cancelled) setConversations(unwrap(response));
      })
      .catch((error) => {
        if (!cancelled) reportError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [reportError]);
  async function loadMessages(
    uid = otherUserId,
    conversation = conversationId,
  ) {
    if (!uid && !conversation) return;
    const result = await state.run("chat", "getMessages", {
      ...(uid
        ? {
            otherUserId: uid,
          }
        : {}),
      ...(conversation
        ? {
            conversationId: conversation,
          }
        : {}),
      fetchServer: true,
    });
    if (result) setMessages(result.value);
  }
  async function messageAction(method, body) {
    const result = await state.run("chat", method, body);
    if (result) {
      await loadMessages();
      state.setNotice("Máy chủ đã xác nhận thao tác tin nhắn.");
    }
  }
  return (
    <>
      <div className="daily-toolbar">
        <h3>Hội thoại</h3>
        <button
          className="button secondary"
          disabled={state.pending}
          onClick={loadConversations}
        >
          <RefreshCw size={15} />
          Tải lại
        </button>
      </div>
      <Feedback state={state} />
      <div className="chat-layout">
        <div className="conversation-list">
          {records(conversations).map((conversation, index) => {
            const uid =
              conversation.peer_uid ||
              conversation.otherUserId ||
              conversation.other_user_id ||
              identity(conversation.other_user || conversation.user);
            const id =
              conversation.conversation_id ||
              conversation.conversationId ||
              conversation.conversation_uid ||
              conversation.uid ||
              conversation.id;
            return (
              <button
                className="conversation"
                key={id || index}
                disabled={state.pending}
                onClick={() => {
                  setOtherUserId(uid || "");
                  setConversationId(id || "");
                  setMessages(null);
                  loadMessages(uid, id);
                }}
              >
                {personName(
                  conversation.other_user ||
                    conversation.user || { uid: uid || id },
                )}
                <br />
                <small>Mở trò chuyện →</small>
              </button>
            );
          })}
          {!records(conversations).length && (
            <p className="muted">
              Chưa có hội thoại để hiển thị. Nhập UID để bắt đầu.
            </p>
          )}
        </div>
        <div>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              loadMessages();
            }}
          >
            <input
              aria-label="UID người nhận tin nhắn"
              placeholder="UID người nhận"
              value={otherUserId}
              disabled={state.pending}
              onChange={(event) => {
                setOtherUserId(event.target.value);
                setConversationId("");
                setMessages(null);
              }}
            />
            <button
              className="button secondary"
              disabled={state.pending || (!otherUserId && !conversationId)}
            >
              Lịch sử
            </button>
          </form>
          <div className="message-list" aria-live="polite">
            {records(messages).map((message, index) => {
              const id =
                message.message_id ||
                message.uid ||
                message.id ||
                message.messageId ||
                message.message_uid;
              const cid =
                conversationId ||
                message.conversation_id ||
                message.conversationId ||
                message.conversation_uid;
              return (
                <article className="message" key={id || index}>
                  <p>
                    {typeof message.text === "string"
                      ? message.text
                      : typeof message.message === "string"
                        ? message.message
                        : "Tin nhắn đính kèm"}
                  </p>
                  <div className="action-row">
                    <button
                      className="button secondary"
                      disabled={state.pending || !cid || !id}
                      onClick={() =>
                        messageAction("sendReaction", {
                          conversationId: cid,
                          messageId: id,
                          emoji: "❤️",
                        })
                      }
                    >
                      <Heart size={13} />
                      Tim
                    </button>
                    <button
                      className="button secondary"
                      disabled={state.pending || !cid || !id}
                      onClick={() =>
                        confirmAction("Gỡ cảm xúc tin nhắn?", () =>
                          messageAction("removeReaction", {
                            conversationId: cid,
                            messageId: id,
                          }),
                        )
                      }
                    >
                      Gỡ cảm xúc
                    </button>
                    <button
                      className="button secondary"
                      disabled={state.pending || !cid || !id}
                      onClick={() =>
                        confirmAction("Thu hồi tin nhắn của anh?", () =>
                          messageAction("deleteMessage", {
                            conversationUid: cid,
                            messageUid: id,
                          }),
                        )
                      }
                    >
                      Thu hồi
                    </button>
                  </div>
                  <Details value={message} />
                </article>
              );
            })}
            {messages !== null && !records(messages).length && (
              <p className="muted">Chưa có tin nhắn trong kết quả trả về.</p>
            )}
          </div>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await state.run(
                "chat",
                momentUid ? "sendMoment" : "sendMessage",
                {
                  receiverUid: otherUserId,
                  ...(text.trim()
                    ? {
                        text,
                      }
                    : {}),
                  ...(momentUid
                    ? {
                        momentUid,
                      }
                    : {}),
                },
              );
              if (result) {
                setText("");
                setMomentUid("");
                await loadMessages();
                state.setNotice("Đã gửi tin nhắn.");
              }
            }}
          >
            <label className="field">
              <span>Tin nhắn</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Kể một chút về ngày của bạn…"
                rows={3}
              />
            </label>
            <label className="field">
              <span>ID khoảnh khắc đính kèm (tuỳ chọn)</span>
              <input
                value={momentUid}
                onChange={(event) => setMomentUid(event.target.value)}
                placeholder="Chia sẻ một khoảnh khắc"
              />
            </label>
            <div className="action-row">
              <button
                className="button primary"
                disabled={
                  state.pending || !otherUserId || (!text.trim() && !momentUid)
                }
              >
                <Send size={16} />
                Gửi tin nhắn
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={state.pending || (!otherUserId && !conversationId)}
                onClick={() =>
                  messageAction("markAsRead", {
                    ...(otherUserId
                      ? {
                          otherUserId,
                        }
                      : {
                          conversationUid: conversationId,
                        }),
                    sendReadReceipt: true,
                  })
                }
              >
                <Check size={15} />
                Đánh dấu đã đọc
              </button>
            </div>
          </form>
        </div>
      </div>
      {conversations !== null && <Details value={conversations} />}
      {messages !== null && <Details value={messages} />}
    </>
  );
}
