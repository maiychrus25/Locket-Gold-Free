import React, { useState, useEffect, useRef, useId } from "react";
import { createRoot } from "react-dom/client";
import {
  Heart,
  LayoutGrid,
  ImagePlus,
  Users,
  MessageCircle,
  UserRound,
  SlidersHorizontal,
  Sun,
  Moon,
  ArrowUpRight,
  ArrowRight,
  Plus,
  X,
  Upload,
  Camera,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ChevronRight,
  LogOut,
  Download,
  Search,
  Check,
  Radio,
  Image,
  LockKeyhole,
} from "lucide-react";
import {
  request,
  records,
  defaults,
  parseFields,
  safeUrl,
  sanitize,
  getSessionGeneration,
} from "./api.js";
import "./styles.css";
import { FeedPanel, FriendsPanel, ChatPanel } from "./DailyPanels.jsx";
const navigation = [
  {
    id: "home",
    label: "Tổng quan",
    icon: LayoutGrid,
  },
  {
    id: "compose",
    label: "Tạo khoảnh khắc",
    icon: ImagePlus,
  },
  {
    id: "friends",
    label: "Bạn bè",
    icon: Users,
  },
  {
    id: "chat",
    label: "Tin nhắn",
    icon: MessageCircle,
  },
  {
    id: "profile",
    label: "Hồ sơ của tôi",
    icon: UserRound,
  },
  {
    id: "tools",
    label: "Công cụ nâng cao",
    icon: SlidersHorizontal,
  },
];
const titles = {
  home: [
    "Những điều nhỏ, thật gần.",
    "Một nơi cho những khoảnh khắc và những người bạn yêu quý.",
  ],
  compose: [
    "Gửi một chút ngày của bạn.",
    "Một bức ảnh, một câu chuyện. Chia sẻ theo cách của riêng bạn.",
  ],
  friends: [
    "Kết nối những người thân quen.",
    "Tìm bạn, quản lý lời mời và giữ vòng tròn của bạn thật gần.",
  ],
  chat: [
    "Chuyện hôm nay, kể nhau nghe.",
    "Tin nhắn và những khoảnh khắc riêng giữa bạn và bạn bè.",
  ],
  profile: [
    "Không gian của riêng bạn.",
    "Chỉnh sửa hồ sơ và thiết lập thiết bị kết nối.",
  ],
  tools: [
    "Nhiều cách hơn để kết nối.",
    "Toàn bộ thao tác được hỗ trợ, trực tiếp từ danh mục máy chủ.",
  ],
};
function Modal({ title, children, close }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Đóng">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Raw({ value }) {
  return (
    <details className="raw">
      <summary>Xem dữ liệu JSON</summary>
      <pre>{JSON.stringify(sanitize(value), null, 2)}</pre>
    </details>
  );
}
function Empty({ icon: _Icon = Image, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <_Icon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function Field({ field, value, change, disabled }) {
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
function RecipientField({ value, change, disabled }) {
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
function MediaInput({ operation, files, setFiles, limit, disabled }) {
  const input = useRef(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const file = files[0];
  const videoOnly = [
    "extractThumbnail",
    "optimizeVideo",
    "uploadVideo",
  ].includes(operation.media);
  const imageOnly = ["updateAvatar", "uploadAvatar", "uploadImage"].includes(
    operation.media,
  );
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function choose(list) {
    const next = list[0];
    if (!next) return;
    if (
      !(videoOnly
        ? next.type.startsWith("video/")
        : imageOnly
          ? next.type.startsWith("image/")
          : /^(image|video)\//.test(next.type))
    ) {
      setError("Vui lòng chọn đúng định dạng ảnh hoặc video.");
      return;
    }
    if (limit && next.size > limit) {
      setError(`Tệp vượt giới hạn ${Math.round(limit / 1024 / 1024)} MB.`);
      return;
    }
    setError("");
    setFiles([next]);
  }
  return (
    <div className="wide">
      <div
        className={`dropzone ${file ? "has-file" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled) choose(event.dataTransfer.files);
        }}
      >
        {file && preview ? (
          <div className="preview">
            {file.type.startsWith("video/") ? (
              <video src={preview} controls />
            ) : (
              <img src={preview} alt="Xem trước khoảnh khắc" />
            )}
            <span>{file.name}</span>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              <Upload size={28} />
            </div>
            <h3>Thả khoảnh khắc vào đây</h3>
            <p>
              {videoOnly
                ? "Video"
                : imageOnly
                  ? "Hình ảnh"
                  : "Hình ảnh hoặc video"}{" "}
              từ thiết bị của bạn
              {limit ? ` · tối đa ${Math.round(limit / 1024 / 1024)} MB` : ""}
            </p>
          </>
        )}
        <button
          type="button"
          className="button secondary"
          disabled={disabled}
          onClick={() => input.current.click()}
        >
          <Plus size={16} />
          {file ? "Chọn tệp khác" : "Chọn từ thiết bị"}
        </button>
        <input
          ref={input}
          type="file"
          accept={
            videoOnly ? "video/*" : imageOnly ? "image/*" : "image/*,video/*"
          }
          hidden
          onChange={(event) => choose(event.target.files)}
        />
      </div>
      {operation.media === "post" && file?.type.startsWith("video/") && (
        <label className="field">
          <span>Ảnh bìa video riêng (tuỳ chọn)</span>
          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={(event) => {
              const thumbnail = event.target.files[0];
              if (!thumbnail) {
                setFiles([file]);
                return;
              }
              if (
                !thumbnail.type.startsWith("image/") ||
                (limit && thumbnail.size > limit)
              ) {
                setError("Ảnh bìa không hợp lệ hoặc vượt giới hạn dung lượng.");
                return;
              }
              setError("");
              setFiles([file, thumbnail]);
            }}
          />
          {files[1] && <small>{files[1].name}</small>}
        </label>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
function Result({ value }) {
  const rows = records(value);
  return (
    <div className="result">
      <div className="result-heading">
        <Check size={16} /> Máy chủ đã phản hồi
      </div>
      {rows.length > 0 && (
        <div className="result-list">
          {rows.map((item, index) => {
            if (!item || typeof item !== "object")
              return <p key={index}>{String(item)}</p>;
            const picture = safeUrl(
              item.thumbnailUrl ||
                item.thumbnail_url ||
                item.imageUrl ||
                item.image_url ||
                item.photoURL ||
                item.avatar,
            );
            const name =
              item.displayName ||
              item.display_name ||
              item.username ||
              item.name ||
              item.uid ||
              item.id;
            return (
              <article className="record" key={item.id || index}>
                {picture && <img src={picture} alt="" loading="lazy" />}
                <div>
                  <strong>
                    {typeof name === "string" ? name : `Mục ${index + 1}`}
                  </strong>
                  {typeof (item.caption || item.text || item.message) ===
                    "string" && (
                    <p>{item.caption || item.text || item.message}</p>
                  )}
                  <Raw value={item} />
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Raw value={value} />
    </div>
  );
}
function OperationForm({
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
function Workspace({
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
      <Empty icon={SlidersHorizontal} title="Chưa có thao tác khả dụng">
        Danh mục thao tác sẽ xuất hiện khi máy chủ kết nối.
      </Empty>
    );
  const key = `${current.group}.${current.method}`;
  if (current.stream)
    return (
      <div className="workspace">
        <label className="field operation-select">
          <span>{initialLabel}</span>
          <select
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
          value={key}
          onChange={(event) => setSelected(event.target.value)}
        >
          {operations.map((operation) => (
            <option
              key={`${operation.group}.${operation.method}`}
              value={`${operation.group}.${operation.method}`}
            >
              {operation.label} — {operation.group}.{operation.method}
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
function Login({ close, connected }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function login(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const session = await request("/api/auth/login", {
        email,
        password,
      });
      if (!session.authenticated)
        throw new Error("Máy chủ chưa xác nhận đăng nhập. Vui lòng thử lại.");
      setPassword("");
      connected(session);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title="Kết nối tài khoản Locket"
      close={() => {
        if (!pending) close();
      }}
    >
      <div className="login-symbol">
        <Heart size={30} />
      </div>
      <p className="muted">
        Mang những khoảnh khắc của bạn về một không gian quen thuộc.
      </p>
      <form onSubmit={login}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={pending}>
          {pending ? "Đang kết nối…" : "Kết nối tài khoản"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="secure-note">
        <ShieldCheck size={16} />
        Phiên đăng nhập được bảo vệ bằng cookie HttpOnly. Token không hiển thị
        trên trình duyệt.
      </p>
    </Modal>
  );
}
function LiveChat({ authenticated }) {
  const [userId, setUserId] = useState("");
  const [active, setActive] = useState("");
  const [status, setStatus] = useState("Chưa kết nối");
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (!active || !authenticated) return;
    const generation = getSessionGeneration();
    const stream = new EventSource(
      `/api/chat/events?otherUserId=${encodeURIComponent(active)}&generation=${encodeURIComponent(generation || "")}`,
      {
        withCredentials: true,
      },
    );
    stream.onopen = () => {
      if (getSessionGeneration() === generation) setStatus("Đang kết nối…");
      else stream.close();
    };
    stream.addEventListener("message", (event) => {
      if (getSessionGeneration() !== generation) {
        stream.close();
        return;
      }
      try {
        setEvents((previous) => [
          ...previous.slice(-99),
          sanitize(JSON.parse(event.data)),
        ]);
      } catch {
        setStatus("Nhận được dữ liệu không hợp lệ");
      }
    });
    stream.addEventListener("status", (event) => {
      if (getSessionGeneration() !== generation) {
        stream.close();
        return;
      }
      try {
        const data = JSON.parse(event.data);
        setStatus(
          {
            connecting: "Đang kết nối…",
            connected: "Đã kết nối",
            reconnecting: "Đang kết nối lại…",
          }[data.state] ||
            (typeof data.status === "string"
              ? data.status
              : "Đã nhận trạng thái kết nối"),
        );
      } catch {
        setStatus("Đã nhận trạng thái kết nối");
      }
    });
    stream.onerror = () => {
      setStatus("Kết nối gián đoạn. Dừng và kết nối lại để tiếp tục.");
      stream.close();
    };
    return () => stream.close();
  }, [active, authenticated]);
  return (
    <section className="live-chat">
      <div className="section-heading">
        <h3>
          <Radio size={18} />
          Tin nhắn trực tiếp
        </h3>
        <span className="badge">{status}</span>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          setEvents([]);
          setStatus("Đang kết nối…");
          setActive(userId.trim());
        }}
      >
        <input
          aria-label="UID người trò chuyện"
          required
          placeholder="UID người bạn muốn trò chuyện"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          disabled={Boolean(active)}
        />
        <button
          className="button secondary"
          disabled={!authenticated || Boolean(active)}
        >
          Kết nối
        </button>
        {active && (
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setActive("");
              setStatus("Đã dừng");
            }}
          >
            Dừng
          </button>
        )}
      </form>
      {events.length > 0 ? (
        <Result value={events} />
      ) : (
        <p className="muted">
          Tin nhắn mới sẽ xuất hiện tại đây khi luồng trực tiếp được kết nối.
        </p>
      )}
    </section>
  );
}
function App() {
  const sessionRevision = useRef(0);
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem("lock-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    } catch {
      return "light";
    }
  });
  const [catalog, setCatalog] = useState({
    operations: [],
    presets: [],
    reactions: [],
  });
  const [session, setSession] = useState({
    authenticated: false,
  });
  const [login, setLogin] = useState(false);
  const [logout, setLogout] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [actionConfirm, setActionConfirm] = useState(null);
  const confirmAction = (title, action) =>
    setActionConfirm({
      title,
      action,
    });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const generation = session.generation || "guest";
  const [draftGeneration, setDraftGeneration] = useState(generation);
  useEffect(() => {
    setDrafts({});
    setActionConfirm(null);
    setLogout(false);
    setDraftGeneration(generation);
  }, [generation]);
  const [feedTab, setFeedTab] = useState("latest");
  const [filter, setFilter] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("lock-theme", theme);
    } catch {
      /* Browser storage may be disabled. */
    }
  }, [theme]);
  async function load() {
    const revision = ++sessionRevision.current;
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      request("/api/catalog"),
      request("/api/auth/session"),
    ]);
    if (revision !== sessionRevision.current) return;
    if (results[0].status === "fulfilled") setCatalog(results[0].value);
    if (results[1].status === "fulfilled") setSession(results[1].value);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) setError(failure.reason.message);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const expired = () => {
      sessionRevision.current++;
      setLoading(false);
      setActionConfirm(null);
      setLogout(false);
      setSession({
        authenticated: false,
      });
      setError(
        "Phiên đăng nhập đã hết hạn. Kết nối lại để tiếp tục; bản nháp đã được xoá để bảo vệ tài khoản.",
      );
    };
    window.addEventListener("lock-session-expired", expired);
    return () => window.removeEventListener("lock-session-expired", expired);
  }, []);
  const operations = catalog.operations || [];
  const authenticated = session.authenticated;
  function relevant(target) {
    return operations.filter((operation) => {
      const key = `${operation.group}.${operation.method}`;
      if (target === "compose") return operation.media === "post";
      if (target === "friends")
        return /friend|group|block|lookup|searchUser|request/i.test(key);
      if (target === "chat") return /chat|conversation|message/i.test(key);
      if (target === "profile")
        return (
          /user|profile|device|session|client|notification|birth|name|avatar/i.test(
            key,
          ) && !/friend|chat|message/i.test(key)
        );
      if (target === "home")
        return (
          /post|feed|history|moment|reaction|comment|view/i.test(key) &&
          !operation.media &&
          !/chat|message/i.test(key)
        );
      return true;
    });
  }
  const workspaceProps = {
    catalog,
    authenticated,
    connect: () => setLogin(true),
    drafts: draftGeneration === generation ? drafts : {},
    setDrafts,
  };
  async function endSession() {
    sessionRevision.current++;
    setLoading(false);
    setLogoutPending(true);
    try {
      await request("/api/auth/logout", {});
      setSession({
        authenticated: false,
      });
      setDrafts({});
      setLogout(false);
      setPage("home");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLogoutPending(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setPage("home");
          }}
        >
          <span className="brand-icon">
            <Heart fill="currentColor" size={23} />
          </span>
          <span>
            lock gold<span className="brand-tag">FREE</span>
          </span>
        </a>
        <div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ id, label, icon: _Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              aria-current={page === id ? "page" : undefined}
              onClick={() => setPage(id)}
            >
              <_Icon size={20} />
              <span>{label}</span>
              {id === "compose" && <Plus size={15} className="nav-plus" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-note">
            <Sparkles size={20} />
            <strong>Thêm một chút gần gũi.</strong>
            <p>Mọi khoảnh khắc đều đáng được giữ lại.</p>
            <button onClick={() => setPage("compose")}>
              Tạo khoảnh khắc <ArrowUpRight size={16} />
            </button>
          </div>
          <button
            className="theme-button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}</span>
            <span className="theme-switch" />
          </button>
          <div className="sidebar-footer">
            <span className="tiny-dot" />
            Made for your little moments
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Không gian cá nhân <ChevronRight size={14} />
            <strong>{navigation.find((item) => item.id === page).label}</strong>
          </span>
          <div className="topbar-actions">
            <span className={`connection ${authenticated ? "online" : ""}`}>
              <span className="tiny-dot" />
              {authenticated ? "Đã kết nối" : "Chưa kết nối"}
            </span>
            <button
              className="icon-button mobile-theme"
              aria-label="Đổi giao diện"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {authenticated ? (
              <button
                className="account-button"
                onClick={() => setPage("profile")}
                aria-label="Hồ sơ"
              >
                <UserRound size={18} />
              </button>
            ) : (
              <button
                className="button compact primary"
                onClick={() => setLogin(true)}
              >
                Kết nối tài khoản <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </header>
        <main key={generation}>
          <div className="page-heading">
            <div className="eyebrow">
              <span className="tiny-dot" /> YOUR LITTLE MOMENTS, TOGETHER
            </div>
            <div className="heading-row">
              <div>
                <h1>{titles[page][0]}</h1>
                <p>{titles[page][1]}</p>
              </div>
              {page === "home" && (
                <button
                  className="button primary"
                  onClick={() => setPage("compose")}
                >
                  <Plus size={18} />
                  Tạo khoảnh khắc
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="error banner" role="alert">
              <span>{error}</span>
              <button
                className="button secondary"
                disabled={loading}
                onClick={load}
              >
                Thử lại
              </button>
            </div>
          )}
          {loading && (
            <p role="status" className="loading">
              <RefreshCw size={17} className="spin" /> Đang kết nối không gian
              của bạn…
            </p>
          )}
          {page === "home" && (
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
          )}
          {page === "compose" && (
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
          )}
          {["friends", "chat", "profile", "tools"].includes(page) && (
            <section className="panel tools-panel">
              <div className="section-heading">
                <h2>{navigation.find((item) => item.id === page).label}</h2>
                <span className="badge">{relevant(page).length} thao tác</span>
              </div>
              {!authenticated && (
                <div className="connect-strip">
                  <LockKeyhole size={21} />
                  <div>
                    <strong>Kết nối để sử dụng không gian này</strong>
                    <p>Bạn có thể xem các tính năng trước khi đăng nhập.</p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => setLogin(true)}
                  >
                    Kết nối
                  </button>
                </div>
              )}
              {page === "profile" && authenticated && (
                <div className="profile-summary">
                  <div className="profile-avatar">
                    <UserRound size={30} />
                  </div>
                  <div>
                    <h3>{session.user?.email || "Tài khoản của bạn"}</h3>
                    <p className="muted">
                      UID: {session.user?.uid || "Không có thông tin"}
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => setLogout(true)}
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                  {session.device && <Raw value={session.device} />}
                </div>
              )}
              {page === "friends" && authenticated && (
                <FriendsPanel confirmAction={confirmAction} />
              )}
              {page === "chat" && authenticated && (
                <ChatPanel confirmAction={confirmAction} />
              )}
              {page === "chat" && <LiveChat authenticated={authenticated} />}
              {page === "tools" && (
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Tìm công cụ"
                    placeholder="Tìm tên tính năng, nhóm hoặc phương thức…"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  />
                </label>
              )}
              <Workspace
                key={`${page}-${authenticated}`}
                {...workspaceProps}
                operations={relevant(page).filter(
                  (operation) =>
                    page !== "tools" ||
                    `${operation.label} ${operation.group} ${operation.method}`
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                )}
              />
            </section>
          )}
          <footer className="main-footer">
            <span>
              <Heart size={13} /> Những điều nhỏ làm nên kết nối lớn.
            </span>
            <span>Lock Gold Free · Không cung cấp mở khóa thuê bao Gold</span>
          </footer>
        </main>
      </div>
      {actionConfirm && draftGeneration === generation && (
        <Modal title={actionConfirm.title} close={() => setActionConfirm(null)}>
          <p>Vui lòng xác nhận trước khi thực hiện thay đổi này.</p>
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => setActionConfirm(null)}
            >
              Huỷ
            </button>
            <button
              className="button danger"
              onClick={() => {
                const action = actionConfirm.action;
                setActionConfirm(null);
                action();
              }}
            >
              Xác nhận
            </button>
          </div>
        </Modal>
      )}
      {login && (
        <Login
          key={generation}
          close={() => setLogin(false)}
          connected={(value) => {
            sessionRevision.current++;
            setLoading(false);
            setError("");
            setSession(value);
            setLogin(false);
          }}
        />
      )}
      {logout && (
        <Modal
          title="Đăng xuất tài khoản?"
          close={() => {
            if (!logoutPending) setLogout(false);
          }}
        >
          <p>
            Phiên kết nối và bản nháp trên trang sẽ được xoá khỏi không gian
            này.
          </p>
          <div className="button-row">
            <button
              className="button secondary"
              disabled={logoutPending}
              onClick={() => setLogout(false)}
            >
              Ở lại
            </button>
            <button
              className="button danger"
              disabled={logoutPending}
              onClick={endSession}
            >
              {logoutPending ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
