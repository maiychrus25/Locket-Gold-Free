import React from "react";
import { Check, Moon, Sun, Palette } from "lucide-react";

export function AppearanceSettings({ theme, setTheme, accent, setAccent }) {
  return (
    <section className="appearance-card">
      <div className="section-heading"><h3><Palette size={19} /> Không gian theo ý bạn</h3><span className="free-label">Miễn phí</span></div>
      <p className="muted">Chọn sắc màu cho website. Thiết lập này lưu trên trình duyệt của bạn.</p>
      <div className="appearance-options" role="group" aria-label="Màu giao diện">
        {[["sunshine", "Nắng vàng"], ["rose", "Sắc hồng"], ["ocean", "Biển xanh"]].map(([value, label]) => <button type="button" key={value} aria-pressed={accent === value} className={`appearance-option ${value}`} onClick={() => setAccent(value)}><span>{accent === value && <Check size={17} />}</span>{label}</button>)}
      </div>
      <div className="appearance-options" role="group" aria-label="Độ sáng giao diện">
        <button type="button" className="button secondary" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun size={17} />Sáng</button>
        <button type="button" className="button secondary" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon size={17} />Tối</button>
      </div>
    </section>
  );
}
