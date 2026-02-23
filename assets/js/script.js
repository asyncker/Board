let currentUserName = '';
let currentUserNameColor = '';
let currentUserAvatarUrl = '';
let currentPage = 0;
let maxPage = 0;
let currentGroupName = '';
let currentGroupTitle = '';
let isLoading = false;
let cacheGroup = {};
const messagesContainer = document.getElementById('messages');

function loadGroupsList() {
  try {
    const groupsList = groups;
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
      avatar.textContent = group.Title ? group.Title[0].toLowerCase() : 'g';
      info.className = 'contact-info';
      h4.textContent = group.Title || group.Name;
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

function addRenderMessage(text, username, color, fileurl) {
  const messageRow = document.createElement('div');
  const avatar = document.createElement('div');
  const bubble = document.createElement('div');
  const nameDiv = document.createElement('div');
  const isMyMessage = currentUserName == username && currentUserNameColor == color;
  messageRow.className = 'message-row' + (isMyMessage ? ' me' : '');
  avatar.className = 'avatar-small';
  avatar.textContent = username[0];
  bubble.className = 'bubble';
  nameDiv.className = 'name';
  nameDiv.style.color = '#' + color.replace('#', '');
  nameDiv.textContent = username;
  bubble.appendChild(nameDiv);
  if (fileurl && fileurl.length >= 5) {
    const viewContent = document.createElement('div');
    const contentDiv = document.createElement('img');
    contentDiv.src = fileurl;
    viewContent.className = 'view-content';
    viewContent.appendChild(contentDiv);
    bubble.append(viewContent);
  }
  if (text) {
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = text;
    bubble.appendChild(textDiv);
  }
  messageRow.appendChild(avatar);
  messageRow.appendChild(bubble);
  return messageRow;
}

async function renderGroupPage(result) {
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
    const attachments = message.attachments;
    const messageRow = addRenderMessage(text, username, usernameColor, attachments[0]);
    messagesContainer.insertBefore(messageRow, messagesContainer.firstChild);
  }
}

document.getElementById('sendBtn').addEventListener('click', async function () {
  const input = document.getElementById('messageInput');
  const messageText = input.value.trim();
  if (messageText) {
    const messageRow = addRenderMessage(messageText, currentUserName, currentUserNameColor, '');
    messagesContainer.appendChild(messageRow);
    if (messagesContainer.scrollTop > messagesContainer.clientHeight) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    input.value = '';
    await createMessage(currentGroupName, messageText, currentUserName, currentUserNameColor, currentUserAvatarUrl, []);
  }
});

messagesContainer.addEventListener('scroll', async function () {
  if (isLoading == false && this.scrollTop < 5 && currentPage > 0) {
    isLoading = true;
    currentPage -= 1;
    const messagesJson = await getPage(currentGroupName, currentPage);
    renderGroupPage(messagesJson);
    isLoading = false;
  }
});

document.addEventListener('DOMContentLoaded', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  currentGroupName = urlParams.get('group') || groups[0].Name;
  currentGroupTitle = groups[0].Title;
  const cacheData = localStorage.getItem(currentGroupName);
  if (cacheData) {
    renderGroupPage(JSON.parse(cacheData));
  }
  currentUserName = localStorage.getItem('username');
  currentUserNameColor = localStorage.getItem('color');
  currentUserAvatarUrl = localStorage.getItem('avatar') || '';
  if (currentUserName == '' || currentUserName == undefined) {
    const r = Math.floor(Math.random() * 156) + 100;
    const g = Math.floor(Math.random() * 156) + 100;
    const b = Math.floor(Math.random() * 156) + 100;
    const hex = n => n.toString(16).padStart(2, '0');
    currentUserNameColor = `#${hex(r)}${hex(g)}${hex(b)}`;
    currentUserName = 'user' + (28 + Math.floor(Math.random() * 50) * 2);
    localStorage.setItem('username', currentUserName);
    localStorage.setItem('color', currentUserNameColor);
    localStorage.setItem('avatar', currentUserAvatarUrl);
  }
  document.querySelector('.sidebar-header').textContent = urlParams.get('name') || 'Board';
  document.getElementById('menuUsername').textContent = currentUserName;
  document.getElementById('menuUsername').style.color = currentUserNameColor;
  document.getElementById('profileIcon').textContent = currentUserName[0];
  document.getElementById('chatTitle').textContent = currentGroupTitle;
  loadGroupsList();
  const page = (await getCountPage(currentGroupName)).data;
  const messagesJson = await getPage(currentGroupName, page);
  if (messagesJson.data) {
    currentGroupTitle = messagesJson.data[0].title;
    if (messagesJson.data) {
      messagesContainer.innerHTML = '';
      renderGroupPage(messagesJson);
    }
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
    const avatarUrl = await uploadFile(file);
    localStorage.setItem('avatar', avatarUrl);
  }
  currentUserName = newUsername;
  currentUserNameColor = newColor;
  document.getElementById('menuUsername').textContent = newUsername;
  document.getElementById('menuUsername').style.color = newColor;
  document.getElementById('profileIcon').textContent = newUsername[0].toUpperCase();
  closeProfileModal();
}

document.getElementById('profileAvatar').addEventListener('change', function(e) {
  document.getElementById('profileAvatarFileName').textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
});