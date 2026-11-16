const http = require('node:http');

// Fixtures describe the SDK's expected envelopes, not verified live Locket behavior.
http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let body = req.body || {};
  const raw = Buffer.concat(chunks).toString();
  try { if (raw) body = JSON.parse(raw); } catch { /* Token refresh uses form encoding. */ }
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  if (path === '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword') {
    if (body.password !== 'test-password') return send(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } });
    return send(200, { localId: 'test-account-uid', email: body.email, idToken: 'fixture-id-token-private', refreshToken: 'fixture-refresh-private', expiresIn: '3600' });
  }
  if (path === '/securetoken.googleapis.com/v1/token') return send(200, { id_token: 'fixture-refreshed-private', refresh_token: 'fixture-refresh-private', expires_in: '3600' });
  if (path.endsWith('/accounts:lookup')) return send(200, { users: [{ email: 'test@example.com' }] });
  if (path.endsWith('/accounts:update')) return send(200, { idToken: 'fixture-id-token-private', refreshToken: 'fixture-refresh-private' });
  if (path.startsWith('/api.locketcamera.com/')) {
    const data = body.data || {};
    if (!req.headers.authorization?.startsWith('Bearer fixture-')) return send(401, { error: 'UNAUTHENTICATED' });
    if (path.endsWith('/fetchUserV2')) return send(200, { result: { data: { uid: data.user_uid, first_name: 'Minh', last_name: 'Anh', username: 'minhanh', profile_picture_url: '' } } });
    if (path.endsWith('/changeProfileInfo')) return send(200, { result: { status: 200, data } });
    if (path.endsWith('/getLatestMomentV2')) return send(200, { result: { data: [] } });
    if (path.endsWith('/getGroupsState')) return send(200, { result: { data: { groups: [], friends: [] } } });
    if (path.endsWith('/sendChatMessageV2')) {
      if (data.msg === 'trigger-upstream-error') return send(503, { error: 'Temporary upstream unavailable' });
      if (!data.receiver_uid || (!data.msg && !data.moment_uid)) return send(400, { error: 'INVALID_MESSAGE' });
      return send(200, { result: { status: 200, data: { conversation_uid: 'test-conversation', message_uid: 'test-message', body: data.msg } } });
    }
    if (path.endsWith('/postMomentV2')) {
      if (!data.thumbnail_url) return send(400, { error: 'MISSING_THUMBNAIL' });
      const stored = (await pm.state.get('locket.posts')) || [];
      const moment = { ...data, canonical_uid: `test-moment-${stored.length + 1}` };
      stored.push(moment);
      await pm.state.set('locket.posts', stored);
      return send(200, { result: { status: 200, data: moment } });
    }
    if (['markAsRead', 'reactToMoment', 'markMomentAsViewed', 'sendFriendRequest', 'acceptFriendRequest', 'removeFriend', 'blockFriend', 'unblockUser', 'setClientData', 'setNotificationToken', 'deleteChatMessage', 'sendChatMessageReaction', 'removeChatMessageReaction', 'deleteMoment'].some(endpoint => path.endsWith('/' + endpoint))) return send(200, { result: { status: 200 } });
    if (path.endsWith('/getFilters')) return send(200, { result: { data: [] } });
    return send(501, { error: 'SDK endpoint not modeled by this fixture' });
  }
  if (path.startsWith('/firebasestorage.googleapis.com/')) {
    if (req.method === 'POST') {
      const base = `http://${req.headers.host}`;
      res.writeHead(200, { 'Content-Type': 'application/json', 'x-goog-upload-url': `${base}/locket/firebasestorage.googleapis.com/upload` });
      return res.end('{}');
    }
    if (req.method === 'PUT') return send(200, { downloadTokens: 'fixture-media-download' });
  }
  if (path.startsWith('/firestore.googleapis.com/')) {
    if (path.endsWith(':runQuery')) return send(200, []);
    return send(200, { documents: [] });
  }
  return send(501, { error: 'Dependency path not modeled' });
}).listen(process.env.PORT || 4418, '127.0.0.1');
