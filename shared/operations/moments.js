import { z } from "zod";
import {
  field,
  text,
  id,
  bool,
  number,
  json,
  date,
  select,
  op,
} from "./fields.js";
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
export const momentOperations = [
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
    {
      media: "post",
    },
  ),
  op("moments", "uploadImage", "Tải ảnh lên kho", [], {
    media: "uploadImage",
  }),
  op(
    "moments",
    "uploadVideo",
    "Tải video lên kho",
    [bool("autoCompress", "Tự nén video", true), priority],
    {
      media: "uploadVideo",
    },
  ),
  op(
    "moments",
    "extractThumbnail",
    "Trích ảnh bìa video",
    [number("timestampSec", "Thời điểm (giây)", 0, 3600, 1)],
    {
      media: "extractThumbnail",
      download: true,
    },
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
    {
      media: "optimizeVideo",
      download: true,
    },
  ),
  op(
    "moments",
    "buildOverlay",
    "Tạo nhãn chú thích",
    [
      text("text", "Nội dung", false, 2000),
      ...overlay.filter((value) => value.name !== "caption"),
    ],
    {
      object: true,
    },
  ),
  op("moments", "getLatest", "Bảng tin bạn bè", [
    text("pageToken", "Trang tiếp theo", false, 4096),
    field("includeHistory", "Bao gồm lịch sử", z.boolean().optional(), "checkbox"),
  ]),
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
    {
      object: true,
    },
  ),
  op("moments", "getMoments", "Lịch sử phân trang", page, {
    object: true,
  }),
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
    {
      destructive: true,
    },
  ),
];
