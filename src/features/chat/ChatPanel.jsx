import React from "react";
import { useOperation } from "../../lib/useOperation.js";
import { useState, useEffect } from "react";
import { request, records } from "../../lib/api.js";
import { unwrap, identity, personName } from "../../lib/data.js";
import { RefreshCw, Heart, Send, Check } from "lucide-react";
import { Feedback } from "../../components/Feedback.jsx";
import { Details } from "../../components/Details.jsx";

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
