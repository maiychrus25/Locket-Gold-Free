import React from "react";
import {
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Heart,
  Camera,
  Users,
  MessageCircle,
  RefreshCw,
  ArrowRight,
  Sun,
  Check,
  ChevronRight,
  LockKeyhole,
  Crown,
  CalendarHeart,
  Video,
  Eye,
} from "lucide-react";
import { FeedPanel } from "./FeedPanel.jsx";
import { RollcallPanel } from "./RollcallPanel.jsx";
import { Empty } from "../../components/Empty.jsx";

export function HomePage({
  authenticated,
  setPage,
  setLogin,
  loading,
  load,
  feedTab,
  setFeedTab,
  session,
  confirmAction,
}) {
  return (
    <>
      <div className="journal-meta"><span>{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span><span><Heart size={13} /> Những điều nhỏ, giữ thật lâu.</span></div>
      <section className={`welcome-card ${authenticated ? "connected-welcome" : ""}`}>
        <div className="welcome-copy">
          <span className="pill">
            <Sparkles size={14} /> MỖI NGÀY MỘT CHÚT GẦN HƠN
          </span>
          <h2>
            Chia sẻ một chút.
            <br />
            Gần nhau hơn.
          </h2>
          <p>
            Ảnh, video và những điều bạn thương.
          </p>
          <button
            className="button dark"
            onClick={() =>
              authenticated ? setPage("compose") : setLogin(true)
            }
          >
            {authenticated ? "Chia sẻ khoảnh khắc" : "Bắt đầu kết nối"}
            <ArrowUpRight size={17} />
          </button>
          <span className="welcome-foot">
            <ShieldCheck size={14} /> Miễn phí, từ những điều nhỏ nhất
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="memory-orbit" />
          <div className="memory-print print-back"><div className="memory-landscape"><span className="memory-sun" /><span className="memory-hill" /></div><span>một chút bình yên ☀</span></div>
          <div className="memory-print print-front"><div className="memory-flower"><span>✿</span><i /></div><span>gửi bạn chút yêu thương</span></div>
          <span className="memory-sticker"><Heart fill="currentColor" size={22} /></span>
          <Sparkles className="memory-spark" size={28} />
        </div>
      </section>
      <div className="stats-row">
        {[
          {
            icon: Camera,
            label: "Đăng khoảnh khắc",
            text: "Kể một chút hôm nay",
            action: "compose",
          },
          {
            icon: Users,
            label: "Vòng tròn nhỏ",
            text: "Những người bạn thương",
            action: "friends",
          },
          {
            icon: MessageCircle,
            label: "Trò chuyện",
            text: "Một lời nhắn, thật gần",
            action: "chat",
          },
        ].map(({ icon: _Icon, label, text, action }) => (
          <button
            className="stat-card"
            key={action}
            onClick={() => setPage(action)}
          >
            <span className={`stat-icon ${action}`}>
              <_Icon size={22} />
            </span>
            <span>
              <strong>{label}</strong>
              <small>{text}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div className="quick-create-strip" aria-label="Lối tắt khoảnh khắc"><span>Không gian của bạn</span><button onClick={() => setFeedTab("history")}><CalendarHeart size={16} />Kỷ niệm</button><button onClick={() => setPage("guide")}><Crown size={16} />Khám phá tính năng</button></div>
      <div className="home-columns">
        <section className="panel feed-panel">
          <div className="section-heading">
            <h2>
              Bảng tin của bạn{" "}
              <span className="small-badge">Locket</span>
            </h2>
            <button
              className="icon-button"
              aria-label="Tải lại danh mục"
              disabled={loading}
              onClick={load}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <div className="tabs" role="tablist" aria-label="Bảng tin">
            <button
              role="tab"
              aria-selected={feedTab === "latest"}
              className={feedTab === "latest" ? "selected" : ""}
              onClick={() => setFeedTab("latest")}
            >
              Mới nhất
            </button>
            <button
              role="tab"
              aria-selected={feedTab === "history"}
              className={feedTab === "history" ? "selected" : ""}
              onClick={() => setFeedTab("history")}
            >
              Lịch sử của tôi
            </button>
            <button role="tab" aria-selected={feedTab === "rollcall"} className={feedTab === "rollcall" ? "selected" : ""} onClick={() => setFeedTab("rollcall")}>Rollcall</button>
          </div>
          {authenticated ? (
            <>
              {feedTab === "rollcall" ? <RollcallPanel /> : <FeedPanel
                key={feedTab}
                tab={feedTab}
                userUid={session.user?.uid}
                confirmAction={confirmAction}
              />}
            </>
          ) : (
            <Empty icon={Camera} title="Những khoảnh khắc đang chờ bạn">
              Kết nối tài khoản Locket để xem bảng tin
              <br />
              và lưu giữ những điều nhỏ bé mỗi ngày.
              <button
                className="text-link"
                onClick={() => setLogin(true)}
              >
                Kết nối tài khoản <ArrowRight size={16} />
              </button>
            </Empty>
          )}
        </section>
        <aside className="home-aside">
          <section className="gold-free-card"><span className="gold-card-symbol"><Crown size={25} /></span><span className="section-kicker">MỌI ĐIỀU BẠN CẦN. MIỄN PHÍ.</span><h3>Tự do chia sẻ.<br />Theo cách của bạn.</h3><p>Ảnh, video, chú thích và lượt xem. Một nơi cho những kết nối thật.</p><div className="gold-card-icons" aria-hidden="true"><Camera size={18} /><Video size={18} /><Eye size={18} /><Heart size={18} /></div><button className="button primary" onClick={() => setPage("guide")}>Khám phá tính năng<ArrowUpRight size={16} /></button></section>
          <section className="panel getting-started">
            <div className="section-heading">
              <h3>Một khởi đầu nhỏ</h3>
              <span className="sun-icon">
                <Sun size={18} />
              </span>
            </div>
            <p>Chỉ vài bước để gần nhau hơn.</p>
            {[
              {
                title: "Kết nối Locket",
                text: "Đăng nhập tài khoản của bạn",
                action: () =>
                  authenticated ? setPage("profile") : setLogin(true),
              },
              {
                title: "Tìm những người thân quen",
                text: "Thêm bạn vào vòng tròn của mình",
                action: () => setPage("friends"),
              },
              {
                title: "Gửi khoảnh khắc đầu tiên",
                text: "Một tấm ảnh thay ngàn lời nói",
                action: () => setPage("compose"),
              },
            ].map((item, index) => (
              <button
                className="step"
                key={item.title}
                onClick={item.action}
              >
                <span>
                  {index === 0 && authenticated ? (
                    <Check size={15} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </section>
          <section className="privacy-card">
            <span>
              <LockKeyhole size={20} />
            </span>
            <h3>Chỉ bạn và những người bạn chọn.</h3>
            <p>
              Bạn quyết định chia sẻ điều gì, với ai. Một không gian
              nhỏ, thật riêng tư.
            </p>
            <button
              className="text-link"
              onClick={() => setPage("profile")}
            >
              Quản lý tài khoản <ArrowUpRight size={15} />
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
