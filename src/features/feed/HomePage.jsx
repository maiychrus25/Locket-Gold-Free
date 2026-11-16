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
} from "lucide-react";
import { FeedPanel } from "./FeedPanel.jsx";
import { Workspace } from "../tools/Workspace.jsx";
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
  workspaceProps,
  relevant,
}) {
  return (
    <>
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="pill">
            <Sparkles size={14} /> MỘT CHÚT NẮNG CHO NGÀY MỚI
          </span>
          <h2>
            Khoảnh khắc của bạn.
            <br />
            Gần nhau hơn một chút.
          </h2>
          <p>
            Đăng ảnh, gửi lời thương và kết nối với bạn bè.
            <br className="desktop-break" />
            Tất cả trong một góc nhỏ, dành riêng cho bạn.
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
            <ShieldCheck size={14} /> Riêng tư, đơn giản và thân thuộc
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-spark one">✳</span>
          <div className="photo-card back">
            <div className="photo-sky">
              <div className="sun-disc" />
              <div className="hill hill-one" />
              <div className="hill hill-two" />
            </div>
            <span>một ngày thật xinh ☀</span>
          </div>
          <div className="photo-card front">
            <div className="flower-scene">
              <div className="flower-stem" />
              <span className="flower">✿</span>
              <span className="small-flower">✿</span>
              <span className="flower-label">little joys</span>
            </div>
            <span>gửi bạn một chút nắng</span>
          </div>
          <span className="floating-heart">
            <Heart fill="currentColor" size={24} />
          </span>
          <span className="art-spark two">✧</span>
        </div>
      </section>
      <div className="stats-row">
        {[
          {
            icon: Camera,
            label: "Khoảnh khắc",
            text: "Lưu lại điều đáng nhớ",
            action: "compose",
          },
          {
            icon: Users,
            label: "Vòng tròn bạn bè",
            text: "Những người thật gần",
            action: "friends",
          },
          {
            icon: MessageCircle,
            label: "Trò chuyện",
            text: "Kể nhau nghe mỗi ngày",
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
          </div>
          {authenticated ? (
            <>
              <FeedPanel
                key={feedTab}
                tab={feedTab}
                userUid={session.user?.uid}
                confirmAction={confirmAction}
              />
              <details className="advanced-disclosure">
                <summary>
                  Thao tác bảng tin khác · lượt xem, bình luận, bộ lọc
                </summary>
                <Workspace
                  {...workspaceProps}
                  operations={relevant("home")}
                />
              </details>
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
