import { safeUrl } from "./api.js";

export const unwrap = (value) => value?.data ?? value;
export const identity = (value) =>
  (typeof value === "string" ? value : "") ||
  value?.uid ||
  value?.user_uid ||
  value?.userUid ||
  value?.id ||
  value?.user?.uid ||
  value?.sender?.uid ||
  "";
export const personName = (value) =>
  value?.displayName ||
  value?.display_name ||
  value?.username ||
  [value?.first_name || value?.firstName, value?.last_name || value?.lastName]
    .filter(Boolean)
    .join(" ") ||
  "Người dùng";
export const imageUrl = (value) =>
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
export const postId = (value) =>
  value?.canonical_uid ||
  value?.uid ||
  value?.id ||
  value?.moment_uid ||
  value?.momentUid;
