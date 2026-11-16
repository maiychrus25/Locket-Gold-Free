import React, { useState, useEffect } from "react";
import { defaults, request, parseFields } from "../../lib/api.js";
import { MediaInput } from "../moments/MediaInput.jsx";
import { Field } from "./Field.jsx";
import { RefreshCw, ArrowUpRight, Download } from "lucide-react";
import { Result } from "../../components/Result.jsx";
import { Modal } from "../../components/Modal.jsx";

export function OperationForm({
  operation,
  catalog,
  authenticated,
  connect,
  draft,
  updateDraft,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(undefined);
  const [confirm, setConfirm] = useState(null);
  const [download, setDownload] = useState(null);
  const values = draft?.values || defaults(operation);
  const files = draft?.files || [];
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download.url);
    },
    [download],
  );
  async function execute(body) {
    setPending(true);
    setError("");
    try {
      let payload = body;
      if (operation.media) {
        if (!files.length)
          throw new Error("Vui lòng chọn ảnh hoặc video trước khi tiếp tục.");
        payload = new FormData();
        payload.append("options", JSON.stringify(body));
        for (const file of files)
          payload.append(
            file.type.startsWith("video/") ? "video" : "image",
            file,
          );
      }
      const response = await request(
        operation.media
          ? `/api/media/${encodeURIComponent(operation.media)}`
          : `/api/operations/${encodeURIComponent(operation.group)}/${encodeURIComponent(operation.method)}`,
        payload,
      );
      if (response instanceof Blob) {
        setDownload({
          url: URL.createObjectURL(response),
          name:
            operation.media === "extractThumbnail"
              ? "locket-thumbnail.jpg"
              : "locket-video.mp4",
        });
        setResult(undefined);
      } else {
        setResult(response.data ?? response);
        setDownload(null);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    if (!authenticated) {
      connect();
      return;
    }
    try {
      const body = parseFields(operation, values);
      if (
        operation.destructive ||
        /delete|remove|block|recall|logout/i.test(operation.method)
      )
        setConfirm(body);
      else execute(body);
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <>
      <form className="operation-form" onSubmit={submit}>
        <div className="operation-heading">
          <h3>{operation.label}</h3>
          <code>
            {operation.group}.{operation.method}
          </code>
        </div>
        {operation.description && (
          <p className="muted">{operation.description}</p>
        )}
        {operation.media === "post" && values.caption && (
          <div
            className="caption-preview"
            style={{
              backgroundColor: /^#[\da-fA-F]{6}$/.test(values.textColor || "")
                ? "var(--soft)"
                : "var(--hero)",
              color: /^#[\da-fA-F]{6}$/.test(values.textColor || "")
                ? values.textColor
                : undefined,
            }}
          >
            {values.icon} {values.caption}
          </div>
        )}
        <div className="fields">
          {operation.media && (
            <MediaInput
              operation={operation}
              files={files}
              setFiles={(next) =>
                updateDraft({
                  values,
                  files: next,
                })
              }
              limit={catalog.limits?.uploadBytes}
              disabled={pending}
            />
          )}
          {(operation.fields || []).map((original) => {
            const field =
              original.name === "noteType"
                ? {
                    ...original,
                    type: "select",
                    options: catalog.presets.map((preset) => ({
                      ...preset,
                      label: (preset.label || preset.value).replaceAll(
                        "_",
                        " ",
                      ),
                    })),
                  }
                : original;
            return (
              <Field
                key={field.name}
                field={field}
                value={values[field.name]}
                disabled={pending}
                change={(value) =>
                  updateDraft({
                    files,
                    values: {
                      ...values,
                      [field.name]: value,
                    },
                  })
                }
              />
            );
          })}
        </div>
        {operation.media &&
          /Video|Thumbnail/.test(operation.media) &&
          catalog.runtime?.ffmpeg === false && (
            <p className="notice">
              Máy chủ chưa có FFmpeg. Một số thao tác video có thể không khả
              dụng.
            </p>
          )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={pending} type="submit">
          {pending ? (
            <RefreshCw size={17} className="spin" />
          ) : (
            <ArrowUpRight size={17} />
          )}{" "}
          {pending
            ? "Đang xử lý…"
            : authenticated
              ? operation.label
              : "Kết nối để tiếp tục"}
        </button>
        <span className="form-note">
          {operation.destructive
            ? "Thao tác cần xác nhận trước khi thực hiện."
            : "Dữ liệu được gửi trực tiếp qua máy chủ của bạn."}
        </span>
      </form>
      {result !== undefined && <Result value={result} />}
      {download && (
        <a
          className="button secondary download"
          href={download.url}
          download={download.name}
        >
          <Download size={17} />
          Tải kết quả xuống
        </a>
      )}
      {confirm && (
        <Modal title="Xác nhận thao tác" close={() => setConfirm(null)}>
          <p>
            Anh muốn thực hiện “{operation.label}”? Thay đổi này có thể không
            hoàn tác được.
          </p>
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Huỷ
            </button>
            <button
              className="button danger"
              onClick={() => {
                const body = confirm;
                setConfirm(null);
                execute(body);
              }}
            >
              Xác nhận thực hiện
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
