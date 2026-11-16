import { z } from "zod";
import { text, id, json, op } from "./fields.js";
export const friendOperations = [
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
    {
      destructive: true,
    },
  ),
  op("friends", "unblock", "Bỏ chặn người dùng", [
    id("userUid", "UID hoặc username"),
  ]),
  op("friends", "suggestFriends", "Gợi ý từ danh bạ", [
    json("phoneContacts", "Danh bạ (mảng JSON)", z.array(z.json()).max(100)),
  ]),
];
