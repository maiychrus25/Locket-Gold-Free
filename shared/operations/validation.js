import { z } from "zod";
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
