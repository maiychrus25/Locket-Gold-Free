import React, { useId, useState, useEffect, useRef } from "react";
import { request, records } from "../../lib/api.js";
import { identity, personName } from "../../lib/data.js";

export function RecipientField({ value, change, disabled, authenticated }) {
  const id = useId();
  const revision = useRef({ request: 0 });
  const [people, setPeople] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  let recipients = [];
  try {
    const selected = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(selected)) recipients = selected;
  } catch { /* Preserve invalid legacy drafts for server validation, without exposing their contents. */ }
  useEffect(() => {
    setPeople(null);
    setPending(false);
    setError("");
    const lifecycle = revision.current;
    return () => { lifecycle.request++; };
  }, [authenticated]);
  async function load() {
    if (!authenticated || pending || disabled) return;
    const current = ++revision.current.request;
    setPending(true);
    setError("");
    try {
      const response = await request("/api/operations/friends/getAllFriends", {});
      if (current !== revision.current.request) return;
      const friends = records(response).map(person => person?.user || person);
      setPeople([...new Map(friends.flatMap(person => {
        const uid = identity(person);
        const name = personName(person);
        return typeof uid === "string" && /^[\w.-]{1,150}$/.test(uid) && typeof name === "string" && name.trim() && name !== uid && name !== "Người dùng"
          ? [[uid, { uid, name }]] : [];
      })).values()]);
    } catch {
      if (current === revision.current.request) setError("Chưa tải được bạn bè. Anh có thể thử lại; lựa chọn trước đó vẫn được giữ nguyên.");
    } finally {
      if (current === revision.current.request) setPending(false);
    }
  }
  return (
    <section className="field wide creator-recipients" aria-labelledby={id}>
      <strong id={id}>Chia sẻ với ai?</strong>
      <p className="muted" role="status">{recipients.length
        ? `Đã chọn ${recipients.length} người nhận.`
        : "Chia sẻ với bạn bè, hoặc bật “Chỉ mình tôi” để giữ riêng."}</p>
      {!authenticated && <p className="muted">Kết nối tài khoản để chọn bạn bè.</p>}
      {authenticated && <>
        <button type="button" className="button secondary" disabled={disabled || pending} onClick={load}>
          {pending ? "Đang tải bạn bè…" : "Chọn từ bạn bè"}
        </button>
        {error && <p role="alert" className="error">{error}</p>}
        {people?.length === 0 && <p className="muted">Chưa có bạn bè có tên để hiển thị. Các lựa chọn trước đó vẫn được giữ lại.</p>}
        {people?.length > 0 && <div className="recipient-picker" aria-label="Chọn người nhận từ bạn bè">
          {people.map(person => <label className="checkbox" key={person.uid}>
            <input type="checkbox" checked={recipients.includes(person.uid)} disabled={disabled || pending}
              onChange={event => {
                const next = event.target.checked ? [...recipients, person.uid] : recipients.filter(uid => uid !== person.uid);
                change(next.length ? JSON.stringify(next) : "");
              }} />
            <span>{person.name}</span>
          </label>)}
        </div>}
        {recipients.length > 0 && <button type="button" className="text-link" disabled={disabled || pending} onClick={() => change("")}>Bỏ chọn tất cả</button>}
      </>}
    </section>
  );
}
