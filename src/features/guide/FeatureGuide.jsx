import React from "react";
import { ArrowUpRight, Camera, Video, Users, Eye, Palette, ShieldCheck, CalendarHeart, MessageCircle, Type, Crown } from "lucide-react";

const features = [
  { title: "Ảnh từ thư viện", icon: Camera, detail: "Chọn ảnh từ thiết bị, thêm chú thích và gửi tới những người bạn chọn.", status: "Dùng miễn phí", action: "Tạo khoảnh khắc", page: "compose" },
  { title: "Video & ảnh bìa", icon: Video, detail: "Gửi những câu chuyện sống động hơn. Chọn video từ thiết bị, thêm ảnh bìa riêng và điều chỉnh chất lượng trước khi chia sẻ.", status: "Dùng miễn phí", action: "Tạo khoảnh khắc", page: "compose" },
  { title: "Chú thích theo ý bạn", icon: Type, detail: "Viết lời nhắn dài hơn, chọn mẫu chú thích, emoji và sắc màu để mỗi khoảnh khắc mang dấu ấn riêng.", status: "Dùng miễn phí", action: "Tạo khoảnh khắc", page: "compose" },
  { title: "Lượt xem & cảm xúc", icon: Eye, detail: "Xem ai đã ghé qua khoảnh khắc của bạn, thả cảm xúc và gửi một lời nhắn thật gần gũi.", status: "Dùng miễn phí", action: "Mở bảng tin", page: "home" },
  { title: "Vòng tròn bạn bè", icon: Users, detail: "Tìm những người thân quen, chấp nhận lời mời và chọn người nhận cho mỗi lần chia sẻ.", status: "Dùng miễn phí", action: "Quản lý bạn bè", page: "friends" },
  { title: "Kỷ niệm & Rollcall", icon: CalendarHeart, detail: "Tìm lại một ngày đáng nhớ, duyệt ảnh theo tháng và xem lại những khoảnh khắc trong tuần của bạn bè.", status: "Dùng miễn phí", action: "Xem kỷ niệm", page: "home" },
  { title: "Tin nhắn riêng", icon: MessageCircle, detail: "Gửi tin nhắn, chia sẻ khoảnh khắc, cảm xúc và xem hội thoại từ tài khoản của bạn.", status: "Dùng miễn phí", action: "Mở tin nhắn", page: "chat" },
  { title: "Giao diện & camera", icon: Palette, detail: "Chụp ảnh ngay trên website, chọn giao diện sáng hoặc tối và một sắc màu bạn yêu thích.", status: "Dùng miễn phí", action: "Tùy chỉnh giao diện", page: "profile" },
  { title: "Không quảng cáo", icon: ShieldCheck, detail: "Không chèn quảng cáo, không màn thanh toán và không yêu cầu mua gói để dùng công cụ của website.", status: "Luôn miễn phí" },
];

export function FeatureGuide({ setPage }) {
  return (
    <div className="feature-guide">
      <section className="free-manifesto"><span className="guide-symbol"><Crown size={32} /></span><div><span className="section-kicker">LOCK GOLD FREE</span><h2>Mọi công cụ trên web đều miễn phí.</h2><p>Ảnh, video, chú thích, bạn bè và những kết nối hằng ngày. Không thanh toán, không paywall. Chọn một tính năng và bắt đầu.</p></div><span className="free-seal">FREE<br /><small>FOR EVERYONE</small></span></section>
      <div className="guide-section-heading"><h2>Thêm cách để gần nhau.</h2><p>Chia sẻ theo cách của bạn, không cần mua thêm bất kỳ gói nào.</p></div>
      <div className="capability-grid">{features.map(({ title, icon: _Icon, detail, status, action, page }) => <article className="capability-card" key={title}><div className="capability-top"><span className="capability-icon"><_Icon size={23} /></span><span className={`capability-status ${action || status === "Luôn miễn phí" ? "available" : "limited"}`}>{status}</span></div><h3>{title}</h3><p>{detail}</p>{action && <button className="text-link" onClick={() => setPage(page)}>{action}<ArrowUpRight size={16} /></button>}</article>)}</div>
      <section className="source-card"><h3>Chia sẻ điều nhỏ, theo cách của bạn.</h3><p>Một tấm ảnh, một đoạn video, một lời nhắn. Bạn chọn chia sẻ với tất cả bạn bè, một vài người thân quen hoặc chỉ giữ cho riêng mình.</p><button className="button primary" onClick={() => setPage("compose")}>Bắt đầu chia sẻ<ArrowUpRight size={16} /></button></section>
    </div>
  );
}
