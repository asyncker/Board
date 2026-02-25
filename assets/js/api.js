const gatewayUrls = [ 'https://gateway.asyncker.workers.dev', 'https://gateway-board.vercel.app' ];
const storageUploadUrls = [ 'https://peerphp.vercel.app/peer/upload' ];
const gatewayUrl = gatewayUrls[0];

async function createGroup(group, title, description, avatarUrl) {
  try {
    const data = { Name: group, Title: title, Description: description, AvatarUrl: avatarUrl };
    const response = await fetch(gatewayUrl + '/api/v1/message/creategroup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { "success": false, "error": { "code": 500, "message": "Error then create group" } };
  }
}

async function createMessage(group, text, username, usernameColor, userAvatarUrl, attachments) {
  try {
    const data = { GroupName: group, Text: text, UserName: username, UserNameColor: usernameColor, UserAvatarUrl: userAvatarUrl, Attachments: attachments };
    const response = await fetch(gatewayUrl + '/api/v1/message/write', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { "success": false, "error": { "code": 500, "message": "Error then create message" } };
  }
}

async function getCountPage(group) {
  try {
    const response = await fetch(gatewayUrl + '/api/v1/message/currentpage?group=' + group);
    const result = await response.json();
    return result;
  } catch (error) {
    return { "success": false, "error": { "code": 500, "message": "Error then get count page" } };
  }
}

async function getPage(group, page) {
  try {
    if (page == undefined) {
        return { "success": false, "error": { "code": 404, "message": "Group/page not found" } };
    }
    const response = await fetch(gatewayUrl + '/api/v1/message/list?group=' + group + '&page=' + page);
    const result = await response.json();
    return result;
  } catch (error) {
    return { "success": false, "error": { "code": 500, "message": "Error then get page" } };
  }
}

async function getSearchGroup(group) {
  try {
    const response = await fetch(gatewayUrl + '/api/v1/search/group?terms=' + group);
    const result = await response.json();
    return result;
  } catch (error) {
    return { "success": false, "error": { "code": 500, "message": "Error then search group" } };
  }
}

async function uploadFile(file) {
  try {
    const randomIndex = Math.floor(Math.random() * storageUploadUrls.length);
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(storageUploadUrls[randomIndex], { method: 'POST', body: formData });
    const result = await response.text();
    return result;
  } catch (error) {
    return '';
  }
}