import React from "react";
import { ImagePlus, Sparkles, Image, Heart, Users } from "lucide-react";
import { Workspace } from "../tools/Workspace.jsx";

export function ComposePage({ workspaceProps, relevant, catalog }) {
  return (
    <div className="editor-grid">
      <section className="panel">
        <div className="section-heading">
          <h2>
            <ImagePlus size={22} />
            Tạo khoảnh khắc
          </h2>
          <span className="badge">Ảnh & video</span>
        </div>
        <Workspace
          {...workspaceProps}
          operations={relevant("compose")}
        />
      </section>
      <aside className="panel tips">
        <Sparkles size={25} />
        <h3>Một chút cảm hứng</h3>
        <p>
          Không cần hoàn hảo. Một ly cà phê, một góc trời, hay nụ cười
          hôm nay.
        </p>
        <div className="tip-line">
          <Image size={18} />
          <span>Chọn ảnh hoặc video từ thiết bị.</span>
        </div>
        <div className="tip-line">
          <Heart size={18} />
          <span>Thêm lời nhắn, màu sắc và emoji theo ý bạn.</span>
        </div>
        <div className="tip-line">
          <Users size={18} />
          <span>Chọn người nhận trước khi chia sẻ.</span>
        </div>
        <hr />
        <h4>Kiểu chú thích có sẵn</h4>
        <div className="preset-chips">
          {catalog.presets.slice(0, 10).map((preset) => (
            <span className="badge" key={preset.value}>
              {preset.label}
            </span>
          ))}
        </div>
        <p className="small">
          Tùy chọn thực tế được máy chủ cung cấp trong biểu mẫu.
        </p>
      </aside>
    </div>
  );
}
