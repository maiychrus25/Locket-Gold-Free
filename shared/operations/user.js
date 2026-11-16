import { z } from "zod";
import { text, id, bool, json, date, op } from "./fields.js";
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
export const userOperations = [
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
  op("user", "updateAvatar", "Đổi ảnh đại diện", [], {
    media: "updateAvatar",
  }),
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
    {
      object: true,
    },
  ),
  op(
    "user",
    "setNotificationToken",
    "Đăng ký token thông báo",
    [
      text("fcmToken", "FCM token", false, 4096),
      bool("autoFake", "Tạo token thử nghiệm", false),
    ],
    {
      object: true,
    },
  ),
];
