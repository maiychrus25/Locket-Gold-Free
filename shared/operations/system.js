import { z } from "zod";
import { text, bool, json, op } from "./fields.js";
export const systemOperations = [
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
    {
      object: true,
    },
  ),
  op("session", "refresh", "Làm mới phiên đăng nhập"),
];
