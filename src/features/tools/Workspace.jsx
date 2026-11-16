import React, { useState } from "react";
import { Empty } from "../../components/Empty.jsx";
import { SlidersHorizontal } from "lucide-react";
import { LiveChat } from "../chat/LiveChat.jsx";
import { OperationForm } from "./OperationForm.jsx";

export function Workspace({
  operations,
  catalog,
  authenticated,
  connect,
  drafts,
  setDrafts,
  initialLabel = "Chọn thao tác",
}) {
  const [selected, setSelected] = useState("");
  const current =
    operations.find(
      (operation) => `${operation.group}.${operation.method}` === selected,
    ) || operations[0];
  if (!current)
    return (
      <Empty icon={SlidersHorizontal} title="Chưa tìm thấy tiện ích phù hợp">
        Bạn thử tìm bằng một từ khác nhé.
      </Empty>
    );
  const key = `${current.group}.${current.method}`;
  if (current.stream)
    return (
      <div className="workspace">
        <label className="field operation-select">
          <span>{initialLabel}</span>
          <select
            aria-label={initialLabel}
            value={key}
            onChange={(event) => setSelected(event.target.value)}
          >
            {operations.map((operation) => (
              <option
                key={`${operation.group}.${operation.method}`}
                value={`${operation.group}.${operation.method}`}
              >
                {operation.label}
              </option>
            ))}
          </select>
        </label>
        <LiveChat authenticated={authenticated} />
      </div>
    );
  return (
    <div className="workspace">
      <label className="field operation-select">
        <span>{initialLabel}</span>
        <select
          aria-label={initialLabel}
          value={key}
          onChange={(event) => setSelected(event.target.value)}
        >
          {operations.map((operation) => (
            <option
              key={`${operation.group}.${operation.method}`}
              value={`${operation.group}.${operation.method}`}
            >
              {operation.label}
            </option>
          ))}
        </select>
      </label>
      <OperationForm
        key={key}
        operation={current}
        catalog={catalog}
        authenticated={authenticated}
        connect={connect}
        draft={drafts[key]}
        updateDraft={(draft) =>
          setDrafts((previous) => ({
            ...previous,
            [key]: draft,
          }))
        }
      />
    </div>
  );
}
