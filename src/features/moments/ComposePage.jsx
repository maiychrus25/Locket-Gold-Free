import React from "react";
import { ImagePlus, Sparkles, Image, Heart, Users } from "lucide-react";
import { Workspace } from "../tools/Workspace.jsx";

export function ComposePage({ workspaceProps, relevant }) {
  return (
    <div className="editor-grid creator-page">
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
          initialLabel="Ảnh hoặc video, theo cách của bạn"
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
        <h4>Giữ lại điều nhỏ hôm nay</h4>
        <p>Chọn một kiểu chú thích ngay dưới khung ảnh, rồi chỉnh màu và emoji theo ý anh.</p>
        <p className="small">Ảnh và video tối đa 32 MB mỗi tệp. Camera chỉ mở khi anh chọn; đóng camera sẽ tắt thiết bị.</p>
      </aside>
    </div>
  );
}
