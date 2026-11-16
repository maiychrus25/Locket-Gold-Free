import { text, id, bool, op } from "./fields.js";
const chatTarget = [
  id("otherUserId", "UID người trò chuyện", false),
  id("conversationId", "ID cuộc trò chuyện", false),
];
export const chatOperations = [
  op("chat", "getSupportedReactions", "Danh sách emoji hỗ trợ"),
  op("chat", "fetchMessagesFromServer", "Lấy tin nhắn từ máy chủ", chatTarget, {
    object: true,
  }),
  op(
    "chat",
    "getMessages",
    "Lịch sử tin nhắn",
    [...chatTarget, bool("fetchServer", "Lấy từ máy chủ", true)],
    {
      object: true,
    },
  ),
  op(
    "chat",
    "sendMessage",
    "Gửi tin nhắn",
    [
      id("receiverUid", "UID người nhận"),
      text("text", "Tin nhắn", false, 4000),
      id("momentUid", "ID khoảnh khắc đính kèm", false),
    ],
    {
      object: true,
    },
  ),
  op("chat", "sendMoment", "Chia sẻ khoảnh khắc vào chat", [
    id("receiverUid", "UID người nhận"),
    id("momentUid", "ID khoảnh khắc"),
    text("text", "Lời nhắn", false, 4000),
  ]),
  op(
    "chat",
    "deleteMessage",
    "Thu hồi tin nhắn của tôi",
    [
      id("conversationUid", "ID cuộc trò chuyện"),
      id("messageUid", "ID tin nhắn"),
    ],
    {
      destructive: true,
    },
  ),
  op("chat", "sendReaction", "Thả cảm xúc tin nhắn", [
    id("conversationId", "ID cuộc trò chuyện"),
    id("messageId", "ID tin nhắn"),
    text("emoji", "Emoji", true, 32),
  ]),
  op("chat", "removeReaction", "Gỡ cảm xúc tin nhắn", [
    id("conversationId", "ID cuộc trò chuyện"),
    id("messageId", "ID tin nhắn"),
  ]),
  op(
    "chat",
    "markAsRead",
    "Đánh dấu đã đọc",
    [
      id("conversationUid", "ID cuộc trò chuyện", false),
      id("otherUserId", "UID người trò chuyện", false),
      bool("sendReadReceipt", "Gửi xác nhận đã đọc", true),
    ],
    {
      object: true,
    },
  ),
  op("chat", "getConversations", "Danh sách cuộc trò chuyện"),
  op(
    "chat",
    "listenRealtime",
    "Nhận tin nhắn trực tiếp",
    [id("otherUserId", "UID người trò chuyện")],
    {
      stream: true,
    },
  ),
];
