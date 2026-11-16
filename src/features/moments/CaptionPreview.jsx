import React from "react";

const isColor = (value) => /^#[\da-fA-F]{6}(?:[\da-fA-F]{2})?$/.test(value || "");
const presetNames = {
  standard: "Chú thích tự do", review: "Cảm nhận", music: "Âm nhạc",
  location: "Nơi chốn", weather: "Thời tiết", time: "Thời gian",
  streak: "Ngày bên nhau", star_sign: "Cung hoàng đạo", poll: "Bình chọn",
  locket_count: "Đếm khoảnh khắc", colors: "Sắc màu", color_palette: "Bảng màu",
  party_time: "Giờ tiệc vui", good_morning: "Chào buổi sáng", goodnight: "Chúc ngủ ngon",
  ootd: "Trang phục hôm nay", miss_you: "Nhớ bạn",
};
export function presetLabel(preset) {
  return presetNames[preset?.value] ||
    (preset?.label && !preset.label.includes("_") && preset.label !== preset.value ? preset.label : "Chú thích sáng tạo");
}
export function presetValues(values, noteType) {
  return { ...values, noteType, icon: "", colors: "", textColor: "" };
}
export function CaptionPreview({ values, presets }) {
  const preset = presets.find((item) => item.value === values.noteType);
  let colors = preset?.colors || [];
  try {
    if (values.colors?.trim()) colors = JSON.parse(values.colors);
  } catch { /* Ignore invalid legacy drafts in the visual preview; validation still guards posting. */ }
  colors = Array.isArray(colors) ? colors.filter(isColor).slice(0, 4) : [];
  const textColor = isColor(values.textColor) ? values.textColor : preset?.textColor;
  const caption = values.caption || (values.noteType && values.noteType !== "standard" ? presetLabel(preset) : "");
  if (!caption && !values.icon) return null;
  return <div className="creator-caption" style={{
    background: colors.length > 1 ? `linear-gradient(120deg, ${colors.join(", ")})` : colors[0] || "#24251e",
    color: isColor(textColor) ? textColor : "#ffffff",
  }}>{values.icon || preset?.icon} {caption}</div>;
}

export function CaptionPresets({ presets, values, onChange, disabled }) {
  return <div className="creator-preset-section wide">
    <h4>Chọn một sắc thái</h4>
    <p className="muted">Xem ngay trên ảnh. Chú thích được gửi riêng, không sửa tệp gốc.</p>
    <div className="creator-presets" aria-label="Kiểu chú thích">
      {presets.map((preset) => <button type="button" className="preset-button" key={preset.value}
        disabled={disabled} aria-pressed={(values.noteType || "standard") === preset.value}
        onClick={() => onChange(presetValues(values, preset.value))}>
        {preset.icon && <span aria-hidden="true">{preset.icon} </span>}{presetLabel(preset)}
      </button>)}
    </div>
  </div>;
}
