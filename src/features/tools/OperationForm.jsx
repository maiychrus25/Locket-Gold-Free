import React, { useState, useEffect } from "react";
import { defaults, request, parseFields } from "../../lib/api.js";
import { CaptionPresets, presetLabel, presetValues } from "../moments/CaptionPreview.jsx";
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
    if (operation.media && !files.length) {
      setError("Vui lòng chọn ảnh hoặc video trước khi tiếp tục.");
      return;
    }
    setPending(true);
    setError("");
    try {
      let payload = body;
      if (operation.media) {
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
      if (operation.media === "post" && body.isPrivate && body.recipients?.length) {
        setError("Hãy bỏ chọn người nhận hoặc tắt “Chỉ mình tôi” trước khi đăng. Lựa chọn của anh vẫn được giữ lại.");
        return;
      }
      if (
        operation.destructive ||
        /delete|remove|block|recall|logout/i.test(operation.method)
      )
        setConfirm(body);
      else execute(body);
    } catch (failure) {
      setError(operation.media === "post" ? "Chưa thể đăng. Hãy kiểm tra lại chú thích và người nhận." : failure.message);
    }
  }
  return (
    <>
      <form className="operation-form" onSubmit={submit}>
        <div className="operation-heading">
          <h3>{operation.label}</h3>
        </div>
        {operation.description && (
          <p className="muted">{operation.description}</p>
        )}
        <div className="fields">
          {operation.media === "post" && <div className="composer-step wide"><span>1</span><h4>Chọn khoảnh khắc</h4><small>Ảnh hoặc video</small></div>}
          {operation.media && (
            <MediaInput
              operation={operation}
              values={values}
              presets={catalog.presets}
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
          {operation.media === "post" && <><div className="composer-step wide"><span>2</span><h4>Thêm dấu ấn của bạn</h4><small>Lời nhắn & sắc màu</small></div><CaptionPresets presets={catalog.presets} values={values} disabled={pending} onChange={(next) => updateDraft({ files, values: next })} /></>}
          {(operation.fields || []).map((original) => {
            const field =
              original.name === "noteType"
                ? {
                    ...original,
                    type: "select",
                    options: catalog.presets.map((preset) => ({
                      ...preset,
                      label: presetLabel(preset),
                    })),
                  }
                : original;
            return (
              <React.Fragment key={field.name}>
              {operation.media === "post" && field.name === "isPrivate" && <div className="composer-step wide"><span>3</span><h4>Gửi đến người bạn thương</h4><small>Bạn quyết định chia sẻ với ai</small></div>}
              <Field
                key={field.name}
                field={field}
                authenticated={authenticated}
                value={values[field.name]}
                disabled={pending}
                change={(value) =>
                  updateDraft({
                    files,
                    values: field.name === "noteType" && operation.media === "post"
                      ? presetValues(values, value)
                      : { ...values, [field.name]: value },
                  })
                }
              />
              </React.Fragment>
            );
          })}
        </div>
        {operation.media === "post" && values.isPrivate && <p className="notice">
          Chế độ riêng tư không thể dùng cùng danh sách người nhận. Nếu đã chọn bạn bè, hãy bỏ chọn “Chỉ mình tôi” hoặc tự xóa người nhận trước khi đăng. Các lựa chọn của anh được giữ nguyên.
        </p>}
        {operation.media &&
          /Video|Thumbnail/.test(operation.media) &&
          catalog.runtime?.ffmpeg === false && (
            <p className="notice">
              Xử lý video hiện chưa sẵn sàng. Bạn có thể thử lại sau.
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
            : "Chỉ chia sẻ khi bạn chọn gửi. Các công cụ đều miễn phí."}
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
