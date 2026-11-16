import { z } from "zod";

const field = (name, label, schema, type = "text", extra = {}) => ({
  name,
  label,
  schema,
  type,
  ...extra,
});
const text = (name, label, required = true, max = 250) =>
  field(
    name,
    label,
    required
      ? z.string().trim().min(1).max(max)
      : z.string().trim().max(max).optional(),
    max > 500 ? "textarea" : "text",
    { required },
  );
const id = (name, label, required = true) =>
  field(
    name,
    label,
    required
      ? z
          .string()
          .trim()
          .min(1)
          .max(150)
          .regex(/^[\w@.:-]+$/)
      : z
          .string()
          .trim()
          .max(150)
          .regex(/^[\w@.:-]*$/)
          .optional(),
    "text",
    { required },
  );
const bool = (name, label, value = false) =>
  field(name, label, z.boolean().default(value), "checkbox", {
    default: value,
  });
const number = (name, label, min, max, value) =>
  field(
    name,
    label,
    z.number().int().min(min).max(max).default(value),
    "number",
    { default: value, min, max },
  );
const json = (name, label, schema, required = false, value) =>
  field(name, label, required ? schema : schema.optional(), "json", {
    required,
    ...(value === undefined ? {} : { default: value }),
  });
const date = (name, label, required = false) =>
  field(
    name,
    label,
    required ? z.iso.date() : z.iso.date().optional(),
    "date",
    { required },
  );
const select = (name, label, values, value) =>
  field(name, label, z.enum(values).default(value), "select", {
    default: value,
    options: values.map((value) => ({ value, label: value })),
  });
const keys = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(/^[\w.-]+$/),
  )
  .max(100);
const colors = json(
  "colors",
  "Màu nền (mảng mã HEX)",
  z.array(z.string().regex(/^#[\da-fA-F]{6}$/)).max(4),
);
const overlay = [
  text("caption", "Chú thích", false, 2000),
  text("noteType", "Mẫu chú thích", false),
  text("icon", "Emoji", false, 32),
  colors,
  field(
    "textColor",
    "Màu chữ",
    z
      .string()
      .regex(/^#[\da-fA-F]{6}$/)
      .optional(),
  ),
];
const priority = select(
  "priority",
  "Ưu tiên nén",
  ["balanced", "video", "audio"],
  "balanced",
);
const page = [
  id("filteredByUserId", "Lọc theo UID", false),
  number("limit", "Số kết quả", 1, 100, 20),
  text("pageToken", "Con trỏ trang tiếp theo", false, 4096),
];
const chatTarget = [
  id("otherUserId", "UID người trò chuyện", false),
  id("conversationId", "ID cuộc trò chuyện", false),
];
const profileSchema = z
  .object({
    first_name: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().min(1).max(100).optional(),
    birthdate: z.iso.date().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Nhập ít nhất một thuộc tính hồ sơ.",
  );
const op = (group, method, label, fields = [], options = {}) => ({
  group,
  method,
  label,
  fields,
  ...options,
});

export const operations = [
  op("user", "getProfile", "Xem hồ sơ theo UID", [
    id("userUid", "UID người dùng", false),
  ]),
  op("user", "getProfileByUsername", "Tìm hồ sơ theo username", [
    id("username", "Username"),
  ]),
  op("user", "updateProfile", "Cập nhật thuộc tính hồ sơ", [
    json(
      "profile",
      "Hồ sơ (first_name, last_name, birthdate)",
      profileSchema,
      true,
    ),
  ]),
  op("user", "updateName", "Đổi tên hiển thị", [
    text("firstName", "Tên", true, 100),
    text("lastName", "Họ", true, 100),
  ]),
  op("user", "updateBirthdate", "Đổi ngày sinh", [
    date("birthdate", "Ngày sinh", true),
  ]),
  op("user", "updateAvatar", "Đổi ảnh đại diện", [], { media: "updateAvatar" }),
  op("user", "uploadAvatar", "Tải ảnh đại diện lên kho", [], {
    media: "uploadAvatar",
  }),
  op(
    "user",
    "syncClientData",
    "Đồng bộ cài đặt ứng dụng",
    [
      bool("pushNotifications", "Bật thông báo", true),
      bool("autoSync", "Tự đồng bộ thiết bị", true),
      json(
        "extraData",
        "Cài đặt bổ sung (JSON)",
        z.record(z.string(), z.json()),
      ),
    ],
    { object: true },
  ),
  op(
    "user",
    "setNotificationToken",
    "Đăng ký token thông báo",
    [
      text("fcmToken", "FCM token", false, 4096),
      bool("autoFake", "Tạo token thử nghiệm", false),
    ],
    { object: true },
  ),
  op(
    "moments",
    "post",
    "Đăng khoảnh khắc ảnh / video",
    [
      ...overlay,
      bool("isPrivate", "Chỉ mình tôi"),
      json("recipients", "UID người nhận (mảng JSON)", keys),
      bool("autoCompress", "Tự nén video", true),
      priority,
    ],
    { media: "post" },
  ),
  op("moments", "uploadImage", "Tải ảnh lên kho", [], { media: "uploadImage" }),
  op(
    "moments",
    "uploadVideo",
    "Tải video lên kho",
    [bool("autoCompress", "Tự nén video", true), priority],
    { media: "uploadVideo" },
  ),
  op(
    "moments",
    "extractThumbnail",
    "Trích ảnh bìa video",
    [number("timestampSec", "Thời điểm (giây)", 0, 3600, 1)],
    { media: "extractThumbnail", download: true },
  ),
  op(
    "moments",
    "optimizeVideo",
    "Nén video HEVC",
    [
      number(
        "targetSizeBytes",
        "Dung lượng đích (byte)",
        100000,
        6291455,
        5650000,
      ),
      number("maxDimension", "Chiều dài tối đa (px)", 240, 3840, 1080),
      bool("preserveResolution", "Giữ độ phân giải", true),
      priority,
    ],
    { media: "optimizeVideo", download: true },
  ),
  op(
    "moments",
    "buildOverlay",
    "Tạo nhãn chú thích",
    [
      text("text", "Nội dung", false, 2000),
      ...overlay.filter((value) => value.name !== "caption"),
    ],
    { object: true },
  ),
  op("moments", "getLatest", "Bảng tin bạn bè"),
  op("moments", "getSharedMomentsByUsername", "Khoảnh khắc theo username", [
    id("username", "Username"),
    number("limit", "Số kết quả", 1, 100, 20),
  ]),
  op("moments", "getSharedMomentsByUser", "Khoảnh khắc theo UID", [
    id("userUid", "UID người dùng"),
    number("limit", "Số kết quả", 1, 100, 20),
  ]),
  op("moments", "getFilters", "Các bộ lọc"),
  op("moments", "markAsViewed", "Đánh dấu khoảnh khắc đã xem", [
    id("momentUid", "ID khoảnh khắc"),
  ]),
  op("moments", "react", "Thả cảm xúc khoảnh khắc", [
    id("momentUid", "ID khoảnh khắc"),
    text("reaction", "Emoji", true, 32),
    bool("fromMemory", "Từ kỷ niệm"),
  ]),
  op("moments", "getRollcallPosts", "Khoảnh khắc Rollcall", [
    number("weekOfYear", "Tuần trong năm", 1, 53, 1),
    number("year", "Năm", 2020, 2100, new Date().getFullYear()),
    text("source", "Nguồn", false),
  ]),
  op(
    "moments",
    "getAllMyMoments",
    "Lịch sử theo khoảng ngày",
    [
      number("limit", "Số kết quả", 1, 500, 50),
      date("startDate", "Từ ngày"),
      date("endDate", "Đến ngày"),
    ],
    { object: true },
  ),
  op("moments", "getMoments", "Lịch sử phân trang", page, { object: true }),
  op("moments", "getViews", "Xem lượt xem khoảnh khắc", [
    id("momentUid", "ID khoảnh khắc"),
  ]),
  op("moments", "comment", "Bình luận khoảnh khắc", [
    id("momentUid", "ID khoảnh khắc"),
    id("receiverUid", "UID người nhận"),
    text("text", "Bình luận", true, 2000),
    bool("fromMemory", "Từ kỷ niệm"),
  ]),
  op(
    "moments",
    "delete",
    "Xóa khoảnh khắc",
    [id("momentUid", "ID khoảnh khắc")],
    { destructive: true },
  ),
  op("friends", "getGroupsAndFriends", "Nhóm và bạn bè"),
  op("friends", "getAllFriends", "Danh sách bạn bè"),
  op("friends", "getFriendRequests", "Lời mời đến / đã gửi"),
  op("friends", "resolveInviteTokenFromUsername", "Tra mã mời theo username", [
    id("username", "Username"),
  ]),
  op("friends", "fetchUserByInviteToken", "Tra người dùng bằng mã mời", [
    id("inviteToken", "Mã mời"),
  ]),
  op("friends", "sendRequest", "Kết bạn bằng UID", [
    id("userUid", "UID người dùng"),
    text("source", "Nguồn lời mời", false),
  ]),
  op("friends", "sendRequestByUsername", "Kết bạn bằng username", [
    id("username", "Username"),
  ]),
  op("friends", "acceptRequest", "Chấp nhận lời mời", [
    id("userUid", "UID người dùng"),
  ]),
  op("friends", "remove", "Hủy kết bạn", [id("userUid", "UID hoặc username")], {
    destructive: true,
  }),
  op(
    "friends",
    "block",
    "Chặn người dùng",
    [id("userUid", "UID hoặc username")],
    { destructive: true },
  ),
  op("friends", "unblock", "Bỏ chặn người dùng", [
    id("userUid", "UID hoặc username"),
  ]),
  op("friends", "suggestFriends", "Gợi ý từ danh bạ", [
    json("phoneContacts", "Danh bạ (mảng JSON)", z.array(z.json()).max(100)),
  ]),
  op("chat", "getSupportedReactions", "Danh sách emoji hỗ trợ"),
  op("chat", "fetchMessagesFromServer", "Lấy tin nhắn từ máy chủ", chatTarget, {
    object: true,
  }),
  op(
    "chat",
    "getMessages",
    "Lịch sử tin nhắn",
    [...chatTarget, bool("fetchServer", "Lấy từ máy chủ", true)],
    { object: true },
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
    { object: true },
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
    { destructive: true },
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
    { object: true },
  ),
  op("chat", "getConversations", "Danh sách cuộc trò chuyện"),
  op(
    "chat",
    "listenRealtime",
    "Nhận tin nhắn trực tiếp",
    [id("otherUserId", "UID người trò chuyện")],
    { stream: true },
  ),
  op("client", "getDevice", "Thông tin thiết bị"),
  op(
    "client",
    "setDevice",
    "Cấu hình thiết bị",
    [
      bool("autoEmulate", "Tự tạo hồ sơ thiết bị", true),
      text("installationId", "Mã cài đặt", false),
      text("modelName", "Tên thiết bị", false),
      text("hardwareModel", "Mã phần cứng", false),
      text("iosVersion", "Phiên bản iOS", false),
      text("appVersion", "Phiên bản ứng dụng", false),
      text("buildNumber", "Số build", false),
      text("bundleId", "Bundle ID", false),
      text("customUserAgent", "User-Agent riêng", false, 500),
      json(
        "customAnalytics",
        "Analytics tùy chỉnh",
        z.record(z.string(), z.json()),
      ),
      text("appcheckToken", "App Check token", false, 4096),
      text("instanceIdToken", "Instance ID token", false, 4096),
    ],
    { object: true },
  ),
  op("session", "refresh", "Làm mới phiên đăng nhập"),
];

export const operationMap = new Map(
  operations.map((value) => [`${value.group}/${value.method}`, value]),
);
export const publicOperations = operations.map(
  ({ fields, object: _object, ...rest }) => ({
    ...rest,
    fields: fields.map(({ schema: _schema, ...field }) => field),
  }),
);

export function validateOperation(operation, input) {
  const shape = Object.fromEntries(
    operation.fields.map((value) => [value.name, value.schema]),
  );
  const result = z.object(shape).strict().parse(input);
  for (const key of Object.keys(result))
    if (result[key] === "" || result[key] === null) delete result[key];
  if (operation.method === "sendMessage" && !result.text && !result.momentUid)
    throw new Error("Nhập nội dung hoặc chọn khoảnh khắc để gửi.");
  if (
    ["getMessages", "fetchMessagesFromServer", "markAsRead"].includes(
      operation.method,
    ) &&
    !result.otherUserId &&
    !result.conversationId &&
    !result.conversationUid
  )
    throw new Error("Nhập UID hoặc ID cuộc trò chuyện.");
  if (result.startDate && result.endDate && result.startDate > result.endDate)
    throw new Error("Ngày bắt đầu phải trước ngày kết thúc.");
  if (
    operation.method === "updateBirthdate" &&
    result.birthdate > new Date().toISOString().slice(0, 10)
  )
    throw new Error("Ngày sinh không thể nằm trong tương lai.");
  if (
    operation.method === "setNotificationToken" &&
    !result.autoFake &&
    !result.fcmToken
  )
    throw new Error("Nhập FCM token hoặc bật tạo token thử nghiệm.");
  if (result.isPrivate && result.recipients?.length)
    throw new Error(
      "Chọn riêng tư hoặc danh sách người nhận, không chọn cả hai.",
    );
  if (Array.isArray(result.recipients) && result.recipients.length === 0)
    delete result.recipients;
  return result;
}
