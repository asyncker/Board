const api = 'https://api.board-app.workers.dev';
const uploadApi = 'https://flask-hello-world-phi-liart.vercel.app/peer/upload';

async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(uploadApi, { method: 'POST', body: formData });
    const result = await response.text();
    return result;
  } catch (error) {
    return '';
  }
}

async function getGroups(title = null) {
  const response = await fetch(`${api}/api/v1/group/list?title=${title}&page=0`);
  const result = await response.json();
  if (!result.success) {
    return { "success": false, "error": { "code": 500, "message": "Error then get groups" } };
  }
  return result.data[0];
}

async function getThreads(groupId = null, page = 0) {
  const response = await fetch(`${api}/api/v1/thread/list?groupId=${groupId}&page=${page}`);
  const result = await response.json();
  if (!result.success) {
    return { "success": false, "error": { "code": 500, "message": "Error then get threads" } };
  }
  return result.data;
}

async function getComments(threadId = null, page = 0) {
  const response = await fetch(`${api}/api/v1/comment/list?threadId=${threadId}&page=${page}`);
  const result = await response.json();
  if (!result.success) {
    return { "success": false, "error": { "code": 500, "message": "Error then get comments" } };
  }
  return result.data;
}

async function getDetailsThreads(groupName = null) {
  const response = await fetch(`${api}/api/v1/thread/details?groupName=${groupName}`);
  const result = await response.json();
  if (!result.success) {
    return { "success": false, "error": { "code": 500, "message": "Error then get threads" } };
  }
  return result.data;
}

async function getDetailsComments(threadId = null) {
  const response = await fetch(`${api}/api/v1/comment/details?threadId=${threadId}`);
  const result = await response.json();
  if (!result.success) {
    return { "success": false, "error": { "code": 500, "message": "Error then get comments" } };
  }
  return result.data;
}

async function createGroup(name, title, description, avatarUrl, local) {
  const response = await fetch(`${api}/api/v1/group/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, title, description, avatarUrl, local })
  });
  const result = await response.json();  
  return result.data;
}

async function createThread(text, titleUrl, groupId, username, usernameColor, userAvatarUrl, local, attachments = []) {
  const response = await fetch(`${api}/api/v1/thread/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titleUrl, groupId, username, usernameColor, userAvatarUrl, text, local, attachments })
  });
  const result = await response.json();
  return result.data;
}

async function createComment(threadId, username, usernameColor, userAvatarUrl, text, attachments = []) {
  const response = await fetch(`${api}/api/v1/comment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId, username, usernameColor, userAvatarUrl, text, attachments })
  });
  const result = await response.json();  
  return result.data;
}

async function watchThreads(threadIds) {
  if (Array.isArray(threadIds) || threadIds.includes("-")) {
    return { "success": false, "error": { "code": 400, "message": "Error watch thread" } };
  }
  const response = await fetch(`${api}/api/v1/thread/watch?threadIds=${threadIds.replace(",", "-")}`);
  const result = await response.json();
  if (!result.success) {
    return { "success": false, "error": { "code": 500, "message": "Error watch thread" } };
  }
  return result.data;
}