import React, { useId, useState } from "react";

export function RecipientField({ value, change, disabled }) {
  const id = useId();
  const [text, setText] = useState(() => {
    try {
      const recipients = typeof value === "string" ? JSON.parse(value) : value;
      return Array.isArray(recipients) ? recipients.join(", ") : "";
    } catch {
      return "";
    }
  });
  return (
    <div className="field wide">
      <label htmlFor={id}>
        <span>Người nhận (UID, ngăn cách bằng dấu phẩy)</span>
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        disabled={disabled}
        placeholder="UID người bạn thứ nhất, UID người bạn thứ hai"
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const recipients = next
            .split(/[,\n]+/)
            .map((uid) => uid.trim())
            .filter(Boolean);
          change(recipients.length ? JSON.stringify(recipients) : "");
        }}
      />
    </div>
  );
}
