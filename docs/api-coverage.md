# Account-facing API coverage

Pinned dependency: `locket.js@0.0.3`. Every account-facing prototype method is checked by `tests/coverage.test.js`. All listed operations remain accessible through the validated backend. Consumer screens expose named daily actions and media utilities; raw protocol forms, identifiers and JSON responses are intentionally absent from the UI at the operator's request.

| SDK operation | Website action | Transport |
| --- | --- | --- |
| `user.getProfile` | Xem hồ sơ theo UID | /api/operations/user/getProfile |
| `user.getProfileByUsername` | Tìm hồ sơ theo username | /api/operations/user/getProfileByUsername |
| `user.updateProfile` | Cập nhật thuộc tính hồ sơ | /api/operations/user/updateProfile |
| `user.updateName` | Đổi tên hiển thị | /api/operations/user/updateName |
| `user.updateBirthdate` | Đổi ngày sinh | /api/operations/user/updateBirthdate |
| `user.updateAvatar` | Đổi ảnh đại diện | /api/media/updateAvatar |
| `user.uploadAvatar` | Tải ảnh đại diện lên kho | /api/media/uploadAvatar |
| `user.syncClientData` | Đồng bộ cài đặt ứng dụng | /api/operations/user/syncClientData |
| `user.setNotificationToken` | Đăng ký token thông báo | /api/operations/user/setNotificationToken |
| `moments.post` | Đăng khoảnh khắc ảnh / video | /api/media/post |
| `moments.uploadImage` | Tải ảnh lên kho | /api/media/uploadImage |
| `moments.uploadVideo` | Tải video lên kho | /api/media/uploadVideo |
| `moments.extractThumbnail` | Trích ảnh bìa video | /api/media/extractThumbnail |
| `moments.optimizeVideo` | Nén video HEVC | /api/media/optimizeVideo |
| `moments.buildOverlay` | Tạo nhãn chú thích | /api/operations/moments/buildOverlay |
| `moments.getLatest` | Bảng tin bạn bè | /api/operations/moments/getLatest |
| `moments.getSharedMomentsByUsername` | Khoảnh khắc theo username | /api/operations/moments/getSharedMomentsByUsername |
| `moments.getSharedMomentsByUser` | Khoảnh khắc theo UID | /api/operations/moments/getSharedMomentsByUser |
| `moments.getFilters` | Các bộ lọc | /api/operations/moments/getFilters |
| `moments.markAsViewed` | Đánh dấu khoảnh khắc đã xem | /api/operations/moments/markAsViewed |
| `moments.react` | Thả cảm xúc khoảnh khắc | /api/operations/moments/react |
| `moments.getRollcallPosts` | Khoảnh khắc Rollcall | /api/operations/moments/getRollcallPosts |
| `moments.getAllMyMoments` | Lịch sử theo khoảng ngày | /api/operations/moments/getAllMyMoments |
| `moments.getMoments` | Lịch sử phân trang | /api/operations/moments/getMoments |
| `moments.getViews` | Xem lượt xem khoảnh khắc | /api/operations/moments/getViews |
| `moments.comment` | Bình luận khoảnh khắc | /api/operations/moments/comment |
| `moments.delete` | Xóa khoảnh khắc | /api/operations/moments/delete |
| `friends.getGroupsAndFriends` | Nhóm và bạn bè | /api/operations/friends/getGroupsAndFriends |
| `friends.getAllFriends` | Danh sách bạn bè | /api/operations/friends/getAllFriends |
| `friends.getFriendRequests` | Lời mời đến / đã gửi | /api/operations/friends/getFriendRequests |
| `friends.resolveInviteTokenFromUsername` | Tra mã mời theo username | /api/operations/friends/resolveInviteTokenFromUsername |
| `friends.fetchUserByInviteToken` | Tra người dùng bằng mã mời | /api/operations/friends/fetchUserByInviteToken |
| `friends.sendRequest` | Kết bạn bằng UID | /api/operations/friends/sendRequest |
| `friends.sendRequestByUsername` | Kết bạn bằng username | /api/operations/friends/sendRequestByUsername |
| `friends.acceptRequest` | Chấp nhận lời mời | /api/operations/friends/acceptRequest |
| `friends.remove` | Hủy kết bạn | /api/operations/friends/remove |
| `friends.block` | Chặn người dùng | /api/operations/friends/block |
| `friends.unblock` | Bỏ chặn người dùng | /api/operations/friends/unblock |
| `friends.suggestFriends` | Gợi ý từ danh bạ | /api/operations/friends/suggestFriends |
| `chat.getSupportedReactions` | Danh sách emoji hỗ trợ | /api/operations/chat/getSupportedReactions |
| `chat.fetchMessagesFromServer` | Lấy tin nhắn từ máy chủ | /api/operations/chat/fetchMessagesFromServer |
| `chat.getMessages` | Lịch sử tin nhắn | /api/operations/chat/getMessages |
| `chat.sendMessage` | Gửi tin nhắn | /api/operations/chat/sendMessage |
| `chat.sendMoment` | Chia sẻ khoảnh khắc vào chat | /api/operations/chat/sendMoment |
| `chat.deleteMessage` | Thu hồi tin nhắn của tôi | /api/operations/chat/deleteMessage |
| `chat.sendReaction` | Thả cảm xúc tin nhắn | /api/operations/chat/sendReaction |
| `chat.removeReaction` | Gỡ cảm xúc tin nhắn | /api/operations/chat/removeReaction |
| `chat.markAsRead` | Đánh dấu đã đọc | /api/operations/chat/markAsRead |
| `chat.getConversations` | Danh sách cuộc trò chuyện | /api/operations/chat/getConversations |
| `chat.listenRealtime` | Nhận tin nhắn trực tiếp | /api/chat/events (SSE) |
| `client.getDevice` | Thông tin thiết bị | /api/operations/client/getDevice |
| `client.setDevice` | Cấu hình thiết bị | /api/operations/client/setDevice |
| `session.refresh` | Làm mới phiên đăng nhập | /api/operations/session/refresh |

## Authentication and local lifecycle

`LocketClient.login` is exposed through `/api/auth/login`; authentication state through `/api/auth/session`; local logout invalidates the server session. Manual refresh and device changes are listed above.

## Deliberate boundaries

`postApi` is an internal raw transport, not a public endpoint proxy. History recording, serializers, query-cursor encoders and device serialization are implementation helpers used by the SDK, not additional user-facing actions. Files are uploaded from the browser; server filesystem paths and arbitrary external media URL fetches are not exposed. Content type is derived from the supported media flow rather than supplied as an arbitrary string. Ownership/receiver validation cannot be disabled in chat deletion/reactions. Callback functions are represented by UI pending state and SSE chat events, not accepted as executable input.

## Additional Python reference

`locketlam` was read to cross-check media priorities (balanced/video/audio), custom thumbnails, caption styling, recipients/private mode and read receipts. It does not add paid-account entitlement to this Node website. See SYSTEM_DOCUMENTATION.md for sources and limitations.
