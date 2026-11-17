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
    shortLabel: "Tổng quan",
    icon: LayoutGrid,
  },
  {
    id: "compose",
    label: "Tạo khoảnh khắc",
    shortLabel: "Tạo",
    icon: ImagePlus,
  },
  {
    id: "friends",
    label: "Bạn bè",
    shortLabel: "Bạn bè",
    icon: Users,
  },
  {
    id: "chat",
    label: "Tin nhắn",
    shortLabel: "Tin nhắn",
    icon: MessageCircle,
  },
  {
    id: "profile",
    label: "Hồ sơ của tôi",
    shortLabel: "Hồ sơ",
    icon: UserRound,
  },
  {
    id: "tools",
    label: "Tiện ích",
    shortLabel: "Tiện ích",
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
    "Chỉnh sửa hồ sơ và chọn giao diện theo ý bạn.",
  ],
  tools: [
    "Một chút chăm chút trước khi gửi.",
    "Nén video và chọn ảnh bìa cho những khoảnh khắc của bạn.",
  ],
  guide: [
    "Một không gian. Không paywall.",
    "Thêm cách chia sẻ, thêm gần gũi. Tất cả đều miễn phí.",
  ],
};
