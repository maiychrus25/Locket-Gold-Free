import React, { useEffect, useState } from 'react';
import { friendName } from "./FriendSelect.jsx";
import { Modal } from '../../components/Modal.jsx';
import { request, records } from '../../lib/api.js';
import { unwrap, imageUrl, identity } from '../../lib/data.js';

export function ViewsDialog({ momentUid, close }) {
  const [result, setResult] = useState({ pending: true, items: [], error: '' });
  useEffect(() => {
    let active = true;
    request('/api/operations/moments/getViews', { momentUid }).then(response => {
      const value = unwrap(response);
      const source = value?.moment_views ?? value?.views ?? value?.viewers ?? value;
      const items = records(source);
      const count = Number.isSafeInteger(value?.count) && value.count >= 0 ? value.count : null;
      const empty = count === 0 || (Array.isArray(source) && !source.length && !(count > 0));
      if (active) setResult({ pending: false, items, count, empty, error: '' });
    }).catch(() => {
      if (active) setResult({ pending: false, items: [], error: "Chưa tải được lượt xem. Vui lòng thử lại." });
    });
    return () => { active = false; };
  }, [momentUid]);
  return <Modal title="Lượt xem khoảnh khắc" close={close}>
    {result.pending && <p role="status">Đang tải lượt xem…</p>}
    {result.error && <p role="alert">{result.error}</p>}
    {!result.pending && !result.error && !result.items.length && <p>{result.empty ? "Chưa có ai xem khoảnh khắc này." : "Chưa thể hiển thị danh sách người xem. Vui lòng thử lại sau."}</p>}
    <ul className="memory-viewers">{result.items.map((record, index) => {
      const person = record?.user || record?.viewer || record;
      const name = friendName(person);
      const uid = identity(person);
      const avatar = imageUrl(person);
      return <li key={typeof uid === 'string' && uid ? `${uid}-${index}` : index}>
        {avatar && <img src={avatar} alt="" loading="lazy" />}
        <span>{typeof name === 'string' ? name : 'Người dùng'}</span>
      </li>;
    })}</ul>
    {!result.pending && !result.error && result.count !== null && <p>{result.count} lượt xem</p>}
  </Modal>;
}
