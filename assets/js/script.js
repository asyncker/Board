let currentUserName = '';
let currentUserNameColor = '';
let currentUserAvatarUrl = '';
let currentPage = 0;
let maxPage = 0;
let currentGroupName = '';
let currentGroupTitle = '';
let isLoading = false;
let isSending = false;
let cacheGroup = {};
const messagesContainer = document.getElementById('messages');

function getColorBySeed(seed, minColor = 100, maxColor = 256) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  hash = hash >>> 0;
  const multColor = maxColor - minColor;
  const r = (((hash & 0xFF0000) >> 16) / 255) * multColor + minColor;
  const g = (((hash & 0x00FF00) >> 8) / 255) * multColor + minColor;
  const b = ((hash & 0x0000FF) / 255) * multColor + minColor;
  const hex = n => Math.floor(n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function addGroupToHistory(groupName, groupTitle, groupAvatarUrl = '', isUpMessage = false) {
  try {
    const group = { Name: groupName, Title: groupTitle, AvatarUrl: groupAvatarUrl };
    let groupHistory = JSON.parse(localStorage.getItem("groupHistory") || "[]");
    groupHistory = groupHistory.filter(g => g.Name !== groupName);
    if (isUpMessage) {
      groupHistory.unshift(group);
    } else {
      groupHistory.push(group);
    }
    localStorage.setItem('groupHistory', JSON.stringify(groupHistory));
  } catch (ex) {
    console.log(ex);
  }
}

function loadGroupsList() {
  try {
    const groupHistory = JSON.parse(localStorage.getItem("groupHistory") || "[]");
    const groupsList = groupHistory.length == 0 ? groups : groupHistory;
    const contactList = document.querySelector('.contact-list');
    contactList.innerHTML = '';
    groupsList.forEach(group => {
      const li = document.createElement('li');
      const avatar = document.createElement('div');
      const info = document.createElement('div');
      const h4 = document.createElement('h4');
      li.className = 'contact-item';
      li.dataset.name = group.Name;
      avatar.className = 'contact-avatar';
      if (group.AvatarUrl) {
        avatar.style.backgroundImage = `url(${group.AvatarUrl})`;
        avatar.textContent = '';
      } else {
        avatar.textContent = group.Title ? group.Title[0].toLowerCase() : 'g';
        avatar.style.backgroundColor = getColorBySeed("salt" + group.Title + group.Name);
      }
      info.className = 'contact-info';
      h4.textContent = group.Title || group.Name;
      addGroupToHistory(group.Name, group.Title, group.AvatarUrl);
      info.appendChild(h4);
      li.appendChild(avatar);
      li.appendChild(info);
      let taskId = 0;
      li.addEventListener('click', async function() {
        if (isLoading == false) {
          const nowTaskId = Math.floor(Math.random() * 100000);
          taskId = nowTaskId;
          document.querySelectorAll('.contact-item').forEach(i => { i.classList.remove('selected'); });
          this.classList.add('selected');
          currentGroupName = this.dataset.name;
          const url = new URL(window.location);
          url.searchParams.set('group', currentGroupName);
          window.history.pushState({}, '', url);
          currentGroupTitle = this.querySelector('h4').textContent;
          let result = cacheGroup[currentGroupName];
          if (taskId == nowTaskId) {
            document.getElementById('chatTitle').textContent = currentGroupTitle;
            messagesContainer.innerHTML = '';
            renderGroupPage(result);
            currentPage = (await getCountPage(currentGroupName)).data;
          }
          if (taskId == nowTaskId) {
            result = await getPage(currentGroupName, currentPage);
            cacheGroup[currentGroupName] = result;
          }
          if (taskId == nowTaskId && currentGroupName == this.dataset.name) {
            if (result.data) {
              messagesContainer.innerHTML = '';
              renderGroupPage(result);
            } else {
              currentGroupTitle = 'Not found';
              openGroupModal(currentGroupName, true);
              document.getElementById('chatTitle').textContent = currentGroupTitle;
            }
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 350);
          }
        }
      });
      contactList.appendChild(li);
    });
  } catch (error) {}
}

function addRenderMessage(text, username, color, fileurl, userAvatarUrl) {
  const messageRow = document.createElement('div');
  const avatar = document.createElement('div');
  const bubble = document.createElement('div');
  const nameDiv = document.createElement('div');
  const isMyMessage = currentUserName == username && currentUserNameColor == color;
  messageRow.className = 'message-row' + (isMyMessage ? ' me' : '');
  avatar.className = 'avatar-small';
  if (userAvatarUrl) {
    avatar.style.backgroundImage = `url(${userAvatarUrl})`;
    avatar.textContent = '';
  } else {
    avatar.textContent = username ? username[0].toUpperCase() : "u";
    avatar.style.backgroundColor = getColorBySeed("salt" + username + color);
  }
  bubble.className = 'bubble';
  nameDiv.className = 'name';
  nameDiv.style.color = '#' + color.replace('#', '');
  nameDiv.textContent = username;
  bubble.appendChild(nameDiv);
  if (fileurl && fileurl.length >= 5) {
    const viewContent = document.createElement('div');
    viewContent.className = 'view-content';
    if (fileurl.match(/\.(mp4|mov|webm|ogg)$/i)) {
      const video = document.createElement('video');
      video.src = fileurl;
      video.controls = true;
      viewContent.appendChild(video);
    } else if (fileurl.match(/\.(mp3|opus|wav|m4a|aac)$/i)) {
      const audio = document.createElement('audio');
      audio.src = fileurl;
      audio.controls = true;
      viewContent.appendChild(audio);
    } else if (fileurl.match(/\.(jpg|png|jpeg|gif)$/i)) {
      const img = document.createElement('img');
      img.src = fileurl;
      viewContent.appendChild(img);
    } else {
      const downloadBtn = document.createElement('a');
      downloadBtn.href = fileurl;
      downloadBtn.download = '';
      downloadBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
      downloadBtn.style.background = 'rgba(0,0,0,0.5)';
      downloadBtn.style.borderRadius = '50%';
      downloadBtn.style.width = '32px';
      downloadBtn.style.height = '32px';
      downloadBtn.style.display = 'flex';
      downloadBtn.style.alignItems = 'center';
      downloadBtn.style.justifyContent = 'center';
      downloadBtn.style.cursor = 'pointer';
      downloadBtn.style.backdropFilter = 'blur(4px)';
      downloadBtn.target = '_blank';
      viewContent.appendChild(downloadBtn);
    }
    bubble.appendChild(viewContent);
  }
  if (text) {
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    function formatTextWithLinksAndBreaks(inputText) {
      if (!inputText) return document.createTextNode('');
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = inputText.split(urlRegex);
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isUrl = i % 2 === 1;
        if (isUrl) {
          const link = document.createElement('a');
          link.href = part;
          link.textContent = part;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          fragment.appendChild(link);
        } else if (part) {
          const lines = part.split('\n');
          for (let j = 0; j < lines.length; j++) {
            if (j > 0) {
              fragment.appendChild(document.createElement('br'));
            }
            if (lines[j]) {
              fragment.appendChild(document.createTextNode(lines[j]));
            }
          }
        }
      }
      return fragment;
    }
    textDiv.appendChild(formatTextWithLinksAndBreaks(text));
    bubble.appendChild(textDiv);
  }
  messageRow.appendChild(avatar);
  messageRow.appendChild(bubble);
  return messageRow;
}

function renderGroupPage(result) {
  if (result == undefined || result.data == undefined) { return; }
  const data = result.data[0];
  const groupName = data.name;
  const groupTitle = data.title;
  const groupAvatarUrl = data.avatarUrl;
  const groupDescription = data.description;
  const messages = data.messages;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const id = message.id;
    const text = message.text;
    const created = message.createdUtcAt;
    const userAvatarUrl = message.userAvatarUrl;
    const username = message.userName || 'null';
    const usernameColor = message.userNameColor || '#000000';
    const attachment = message.attachments?.[0];
    const messageRow = addRenderMessage(text, username, usernameColor, attachment, userAvatarUrl);
    messagesContainer.insertBefore(messageRow, messagesContainer.firstChild);
  }
}

document.getElementById('sendBtn').addEventListener('click', async function (e) {
  if (isSending) { return; }
  isSending = true;
  const input = document.getElementById('messageInput');
  const messageText = input.value.trim();
  const file = document.getElementById('fileInput').files[0];
  if (!messageText && !file) { 
    return;
  }
  let fileUrl = '';
  if (file) {
    fileUrl = await uploadFile(file);
    document.getElementById('fileInput').value = '';
  }
  const messageRow = addRenderMessage(messageText, currentUserName, currentUserNameColor, fileUrl, currentUserAvatarUrl);
  messagesContainer.appendChild(messageRow);
  if (messagesContainer.scrollTop > messagesContainer.clientHeight) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  input.value = '';
  await createMessage(currentGroupName, messageText, currentUserName, currentUserNameColor, currentUserAvatarUrl, fileUrl ? [fileUrl] : []);
  isSending = false;
});

document.getElementById('attachBtn').addEventListener('click', function (e) {
  document.getElementById('fileInput').click();
});

messagesContainer.addEventListener('scroll', async function () {
  if (isLoading == false && this.scrollTop < 5 && currentPage > 0) {
    isLoading = true;
    currentPage -= 1;
    const oldScrollHeight = this.scrollHeight;
    const oldScrollTop = this.scrollTop;
    const messagesJson = await getPage(currentGroupName, currentPage);
    renderGroupPage(messagesJson);
    setTimeout(() => {
      const newScrollHeight = this.scrollHeight;
      this.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
      isLoading = false;
    }, 10);
  }
});

document.addEventListener('DOMContentLoaded', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  currentGroupName = urlParams.get('group') || groups[0].Name;
  currentGroupTitle = urlParams.get('group') || groups[0].Title;
  currentUserName = localStorage.getItem('username');
  currentUserNameColor = localStorage.getItem('color');
  currentUserAvatarUrl = localStorage.getItem('avatar') || '';
  if (currentUserName == '' || currentUserName == undefined) {
    currentUserNameColor = getColorBySeed("salt" + Math.random());
    currentUserName = 'user' + (28 + Math.floor(Math.random() * 50) * 2);
    localStorage.setItem('username', currentUserName);
    localStorage.setItem('color', currentUserNameColor);
    localStorage.setItem('avatar', currentUserAvatarUrl);
  }
  document.querySelector('.sidebar-header').textContent = urlParams.get('name') || 'Board';
  document.getElementById('menuUsername').textContent = currentUserName.length > 300 ? currentUserName.substring(0, 300) + '...' : currentUserName;
  document.getElementById('menuUsername').style.color = currentUserNameColor;
  document.getElementById('chatTitle').textContent = currentGroupTitle;
  const profileIcon = document.getElementById('profileIcon');
  if (currentUserAvatarUrl) {
    profileIcon.style.backgroundImage = `url(${currentUserAvatarUrl})`;
    profileIcon.textContent = '';
  } else {
    profileIcon.textContent = currentUserName[0].toUpperCase();
    profileIcon.style.backgroundColor = getColorBySeed("salt" + currentUserName + currentUserNameColor);
  }
  loadGroupsList();
  const page = (await getCountPage(currentGroupName)).data;
  const messagesJson = await getPage(currentGroupName, page);
  if (messagesJson.data) {
    const messagesJsonData = messagesJson.data[0];
    currentGroupTitle = messagesJsonData.title;
    messagesContainer.innerHTML = '';
    renderGroupPage(messagesJson);
    addGroupToHistory(messagesJsonData.name, messagesJsonData.title, messagesJsonData.avatarUrl, true);
    const messagesStrJson = JSON.stringify(messagesJson);
    if (messagesStrJson.length < 75000) {
      localStorage.setItem(currentGroupName, messagesStrJson);
    }
    cacheGroup[currentGroupName] = messagesJson;
  } else {
    currentGroupTitle = 'Not found';
    openGroupModal(currentGroupName, true);
  }
  document.getElementById('chatTitle').textContent = currentGroupTitle;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  currentPage = page;
});

function openGroupModal(groupName = '', groupInputDisabled = false) {
  document.getElementById('groupModal').style.display = 'flex';
  document.getElementById('groupName').value = groupName;
  document.getElementById('groupTitle').value = '';
  document.getElementById('groupDescription').value = '';
  document.getElementById('avatarFileName').textContent = 'No file chosen';
  document.getElementById('groupAvatar').value = '';
  document.getElementById('groupName').disabled = groupInputDisabled;
}

function closeGroupModal() {
  document.getElementById('groupModal').style.display = 'none';
}

async function createGroupFromModal() {
  const groupName = document.getElementById('groupName').value.trim();
  const groupTitle = document.getElementById('groupTitle').value.trim() || groupName;
  const description = document.getElementById('groupDescription').value.trim() || '';
  const file = document.getElementById('groupAvatar').files[0];
  if (!groupName) {
    return;
  }
  try {
    const avatarUrl = file ? await uploadFile(file) : '';
    const createGroupAnswer = await createGroup(groupName, groupTitle, description, avatarUrl);
    if (createGroupAnswer.data) {
      closeGroupModal();
      loadGroupsList();
      document.getElementById('chatTitle').textContent = groupTitle;
      messagesContainer.innerHTML = '';
      const page = (await getCountPage(groupName)).data;
      const result = await getPage(groupName, page);
      const url = new URL(window.location);
      url.searchParams.set('group', groupName);
      window.history.pushState({}, '', url);
      if (result.data) renderGroupPage(result);
      currentGroupName = groupName;
      currentPage = page;
    } else {
      alert(groupName + ' is exists');
    }
  } catch (error) {
    alert(groupName + ' is exists or server 500 error');
  }
}

document.getElementById('groupAvatar').addEventListener('change', function(e) {
  document.getElementById('avatarFileName').textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
});

function openProfileModal() {
  document.getElementById('profileMenu').classList.remove('show');
  document.getElementById('profileUsername').value = currentUserName;
  document.getElementById('profileColor').value = currentUserNameColor;
  document.getElementById('profileAvatarFileName').textContent = currentUserAvatarUrl ? 'Avatar set' : 'No file chosen';
  document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

async function saveProfile() {
  const newUsername = document.getElementById('profileUsername').value.trim();
  const newColor = document.getElementById('profileColor').value.trim();
  const file = document.getElementById('profileAvatar').files[0];
  const usernameMaxLength = 2048;
  if (newUsername.length >= usernameMaxLength) {
    alert('username length must less than ' + usernameMaxLength);
    return;
  }
  if (!newUsername || !/^#[0-9A-F]{6}$/i.test(newColor)) {
    return;
  }
  localStorage.setItem('username', newUsername);
  localStorage.setItem('color', newColor);
  if (file) {
    currentUserAvatarUrl = await uploadFile(file);
    localStorage.setItem('avatar', currentUserAvatarUrl);
  }
  currentUserName = newUsername;
  currentUserNameColor = newColor;
  document.getElementById('menuUsername').textContent = newUsername.length > 300 ? newUsername.substring(0, 300) + '...' : newUsername;
  document.getElementById('menuUsername').style.color = newColor;
  const profileIcon = document.getElementById('profileIcon');
  if (currentUserAvatarUrl) {
    profileIcon.style.backgroundImage = `url(${currentUserAvatarUrl})`;
    profileIcon.style.backgroundSize = 'cover';
    profileIcon.style.backgroundPosition = 'center';
    profileIcon.textContent = '';
  } else {
    profileIcon.textContent = newUsername[0].toUpperCase();
    profileIcon.style.backgroundColor = getColorBySeed("salt" + currentUserName + currentUserNameColor);
  }
  closeProfileModal();
}

document.getElementById('profileAvatar').addEventListener('change', function(e) {
  document.getElementById('profileAvatarFileName').textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
});