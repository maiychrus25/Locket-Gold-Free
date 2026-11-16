import {
  LayoutGrid,
  ImagePlus,
  Users,
  MessageCircle,
  UserRound,
  SlidersHorizontal,
} from "lucide-react";

export const navigation = [
  {
    id: "home",
    label: "Tổng quan",
    icon: LayoutGrid,
  },
  {
    id: "compose",
    label: "Tạo khoảnh khắc",
    icon: ImagePlus,
  },
  {
    id: "friends",
    label: "Bạn bè",
    icon: Users,
  },
  {
    id: "chat",
    label: "Tin nhắn",
    icon: MessageCircle,
  },
  {
    id: "profile",
    label: "Hồ sơ của tôi",
    icon: UserRound,
  },
  {
    id: "tools",
    label: "Công cụ nâng cao",
    icon: SlidersHorizontal,
  },
];
export const titles = {
  home: [
    "Những điều nhỏ, thật gần.",
    "Một nơi cho những khoảnh khắc và những người bạn yêu quý.",
  ],
  compose: [
    "Gửi một chút ngày của bạn.",
    "Một bức ảnh, một câu chuyện. Chia sẻ theo cách của riêng bạn.",
  ],
  friends: [
    "Kết nối những người thân quen.",
    "Tìm bạn, quản lý lời mời và giữ vòng tròn của bạn thật gần.",
  ],
  chat: [
    "Chuyện hôm nay, kể nhau nghe.",
    "Tin nhắn và những khoảnh khắc riêng giữa bạn và bạn bè.",
  ],
  profile: [
    "Không gian của riêng bạn.",
    "Chỉnh sửa hồ sơ và thiết lập thiết bị kết nối.",
  ],
  tools: [
    "Nhiều cách hơn để kết nối.",
    "Toàn bộ thao tác được hỗ trợ, trực tiếp từ danh mục máy chủ.",
  ],
};
