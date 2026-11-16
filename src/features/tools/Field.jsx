import React, { useId } from "react";
import { RecipientField } from "../moments/RecipientField.jsx";

export function Field({ field, value, change, disabled }) {
  const id = useId();
  const props = {
    id,
    disabled,
    required: field.required,
    value: value ?? "",
    onChange: (event) => change(event.target.value),
  };
  if (field.name === "colors") {
    let colors = [];
    try {
      colors = typeof value === "string" ? JSON.parse(value) : value || [];
    } catch {
      colors = [];
    }
    if (!Array.isArray(colors)) colors = [];
    const palette = [colors[0] || "#f4c542", colors[1] || "#717c45"];
    return (
      <fieldset className="color-fields wide">
        <legend>Màu nền chuyển sắc</legend>
        <div className="color-pickers">
          {palette.map((color, index) => (
            <label className="field" key={index}>
              <span>{index === 0 ? "Màu bắt đầu" : "Màu kết thúc"}</span>
              <input
                type="color"
                value={/^#[\da-fA-F]{6}$/.test(color) ? color : "#f4c542"}
                disabled={disabled}
                onChange={(event) => {
                  const next = [...palette];
                  next[index] = event.target.value;
                  change(JSON.stringify(next));
                }}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          className="text-link"
          disabled={disabled}
          onClick={() => change("")}
        >
          Dùng màu của mẫu chú thích
        </button>
      </fieldset>
    );
  }
  if (field.name === "recipients")
    return <RecipientField value={value} change={change} disabled={disabled} />;
  if (field.type === "checkbox")
    return (
      <label className="checkbox" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          disabled={disabled}
          checked={Boolean(value)}
          onChange={(event) => change(event.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  return (
    <div
      className={`field ${["textarea", "json"].includes(field.type) ? "wide" : ""}`}
    >
      <label htmlFor={id}>
        <span>
          {field.label}
          {field.required && <b> *</b>}
        </span>
      </label>
      {field.type === "select" ? (
        <select {...props}>
          <option value="">Chọn một giá trị</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {{
                balanced: "Cân bằng chất lượng",
                video: "Ưu tiên hình ảnh",
                audio: "Ưu tiên âm thanh",
              }[option.value] || option.label}
            </option>
          ))}
        </select>
      ) : ["textarea", "json"].includes(field.type) ? (
        <textarea
          {...props}
          rows={field.type === "json" ? 4 : 3}
          spellCheck={field.type !== "json"}
          placeholder={
            field.type === "json"
              ? 'Ví dụ: ["user-id"] hoặc {"key": "value"}'
              : field.label
          }
        />
      ) : (
        <input
          {...props}
          type={
            /token|secret|password/i.test(field.name)
              ? "password"
              : ["number", "date"].includes(field.type)
                ? field.type
                : "text"
          }
          min={field.min}
          max={field.max}
          step={field.type === "number" ? "any" : undefined}
          placeholder={field.label}
        />
      )}
    </div>
  );
}
