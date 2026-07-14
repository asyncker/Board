const mainContent = document.getElementById('mainContent');
const burgerMenuBtn = document.getElementById('burgerMenuBtn');
const sidebarLeft = document.getElementById('sidebarLeft');
const sidebarLinks = document.getElementById('sidebarLinks');
const archivedSettingBtn = document.getElementById('archivedSettingBtn');
const inputSendThreadBtn = document.getElementById('inputSendThreadBtn');
const inputTextareaThread = document.getElementById('inputTextareaThread');
const posts = document.getElementById('posts');
const attachFileBtn = document.getElementById('attachFileBtn');
const attachmentPreviewArea = document.getElementById('attachmentPreviewArea');
let username = localStorage.getItem('username');
let color = localStorage.getItem('color');
let avatar = localStorage.getItem('avatar');
let token = localStorage.getItem('token');
let local = localStorage.getItem('local');
let localui = localStorage.getItem('localui');
let localcontent = localStorage.getItem('localcontent');
let isPressArchive = false;
let groupsFavorite = JSON.parse(localStorage.getItem('groupsFavorite')) || {}; // "name": ["groupsArchived", "https://groupsSearch"]
let groupsArchived = JSON.parse(localStorage.getItem('groupsArchived')) || {};
let attachedFiles = [];
let countThread = 0;
let countComment = 0;
let page = 0;
let group = 'b'; // b, b-en, b-ru, b-uk
let groupid = 0;
let threadid = -1;
let loading = false;
let todayVisitDate = null;

function endsWithDashTwoChars(str) {
  return str.length >= 3 && str[str.length - 3] === '-' && str.slice(-2).length === 2;
}

document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  if (username == undefined) {
    username = `user${Math.floor(Math.random() * 60) * 2 + 2}`;
    localStorage.setItem('username', username);
  }
  if (token == undefined) {
    token = 'ba2' + getRandomSid(38);
    const sid = 'do3' + getRandomSid(38);
    localStorage.setItem('token', token);
    localStorage.setItem('wallet', token);
    localStorage.setItem('sid', sid);
  }
  if (color == undefined) {
    color = getColorBySeed('salt' + Math.random());
    localStorage.setItem('color', color);
  }
  if (local == undefined) {
    const englishLocales = ['en', 'ca', 'au', 'uk', 'gb', 'nz', 'ie', 'za'];
    const ukSameLocales = ['uk', 'gb', 'nz', 'ie'];
    const usaLocales = ['en', 'ca', 'au'];
    const localUser = getLocalUser();
    local = localUser.timezone == 'en' ? localUser.userlang : localUser.timezone;
    localui = englishLocales.includes(local) ? 'en' : local;
    localcontent = usaLocales.includes(local) ? 'en' : (ukSameLocales.includes(local) ? 'uk' : local);
    localStorage.setItem('local', local);
    localStorage.setItem('localui', localui);
    localStorage.setItem('localcontent', localcontent);
  }
  const todayDate = new Date();
  let todayVisit = localStorage.getItem('todayVisit');
  if (todayVisit == undefined) {
    todayVisit = todayDate.toISOString();
    localStorage.setItem('todayVisit', todayVisit);
  }
  if (localui == 'ru') {
    const translations = {
      ru: {
        brand: "Доска",
        like: "Нравится",
        archive: "Архив",
        comments: "Ответа",
        views: "Просмотров",
        sidebarAccount: "АККАУНТ",
        sidebarMyProfile: "Мой профиль",
        sidebarArchive: "Архив",
        sidebarSearch: "Поиск",
        sidebarThreads: "ПОТОКИ",
        modalEditProfile: "Изменить профиль",
        modalEditUsername: "👤 Имя пользователя",
        modalEditAccessToken: "🗝️ Токен доступа",
        modalEditUsernameColor: "🎨 Цвет имени пользователя",
        modalEditLanguage: "🌐 Язык",
        modalEditCancel: "Отменить",
        modalEditSave: "Сохранить",
        inputTextareaThread: "Написать тред..."
      }
    };
    const localLang = translations.ru;
    document.getElementById("brand").innerHTML = localLang.brand;
    //document.getElementById("like").innerHTML = localLang.like;
    //document.getElementById("archive").innerHTML = localLang.archive;
    document.getElementById("sidebarAccount").innerHTML = localLang.sidebarAccount;
    document.getElementById("sidebarMyProfile").innerHTML = localLang.sidebarMyProfile;
    document.getElementById("sidebarArchive").innerHTML = localLang.sidebarArchive;
    document.getElementById("sidebarSearch").innerHTML = localLang.sidebarSearch;
    document.getElementById("sidebarThreads").innerHTML = localLang.sidebarThreads;
    document.getElementById("modalEditProfile").innerHTML = localLang.modalEditProfile;
    document.getElementById("modalEditUsername").innerHTML = localLang.modalEditUsername;
    document.getElementById("modalEditAccessToken").innerHTML = localLang.modalEditAccessToken;
    document.getElementById("modalEditUsernameColor").innerHTML = localLang.modalEditUsernameColor;
    document.getElementById("modalEditLanguage").innerHTML = localLang.modalEditLanguage;
    document.getElementById("modalCancelBtn").innerHTML = localLang.modalEditCancel;
    document.getElementById("modalSaveProfileBtn").innerHTML = localLang.modalEditSave;
    document.getElementById("inputTextareaThread").placeholder = localLang.inputTextareaThread;
  }
  modalUsername.value = username;
  modalColor.value = color;
  modalToken.value = token;
  setGroups(groupsFavorite);
  group = urlParams.get('group') || group;
  if (group.endsWith('-en')) {
    group = group.slice(0, -3);
  } else if (!endsWithDashTwoChars(group)) { // check local
    group = group + '-' + localcontent;
  }
  const thread = urlParams.get('thread') || "-0";
  threadid = parseInt(thread.split('-').pop());
  if (threadid == 0) {
    const groupInfo = await getOrCreateGroupInfo(group);
    document.getElementById('groupName').textContent = groupInfo.group.title;
    document.getElementById('groupNameMobile').textContent = groupInfo.group.title;
    document.getElementById('groupTitle').textContent = groupInfo.group.title;
    document.getElementById('groupText').textContent = groupInfo.group.description;
    appendThreadPageHtml(groupInfo.threads);
    document.getElementById('groupPost').style.display = '';
    document.getElementById('groupAvatar').style.backgroundImage = `url('${groupInfo.group.avatarUrl}')`;
    countThread = groupInfo.group.countThread;
    groupid = groupInfo.group.id;
    page = parseInt(countThread / 100);
  } else {
    const commentInfo = await getDetailsComments(threadid);
    document.getElementById('threadUsername').textContent = commentInfo.thread.username;
    document.getElementById('threadDate').textContent = formatPostDate(commentInfo.thread.createdUtcAt);
    document.getElementById('threadUsername').style.color = commentInfo.thread.usernameColor;
    document.getElementById('threadCommentsCount').textContent = commentInfo.thread.countMessages;
    document.getElementById('threadViewsCount').textContent = commentInfo.thread.countViews;
    document.getElementById('threadText').textContent = commentInfo.thread.text;
    document.getElementById('threadAvatar').style.backgroundSize = 'cover';
    document.getElementById('threadAvatar').style.backgroundPosition = 'center';
    appendCommentPageHtml(commentInfo.comments);
    document.getElementById('threadPost').style.display = '';
    document.getElementById('threadAvatar').style.backgroundImage = `url('${commentInfo.thread.userAvatarUrl}')`;
  }
  todayVisitDate = new Date(todayVisit);
  const nextVisitDate = new Date(todayVisitDate.getTime() + 24 * 60 * 60 * 1000);
  if (nextVisitDate < todayDate) {
    todayVisit = todayDate.toISOString();
    localStorage.setItem("todayVisit", todayVisit);
  }
  modalUploadAvatarBtn.style.backgroundImage = `url('${avatar}')`;
});

async function getOrCreateGroupInfo(groupName) {
  let groupInfo = await getDetailsThreads(groupName);
  if (groupInfo.success == false) {
    const groupInfoEng = await getDetailsThreads(groupEngName);
    groupInfoEng.threads = [];
    groupInfoEng.group.countThread = 0;
    groupInfoEng.name = groupName;
    groupInfoEng.local = localcontent;
    if (groupInfoEng.local != 'uk') {
      groupInfoEng.group.title = (await tryTranslateOrNull(groupInfoEng.group.title, groupInfoEng.local));
      groupInfoEng.group.description = (await tryTranslateOrNull(groupInfoEng.group.description, groupInfoEng.local));
    }
    const result = await createGroup(groupInfoEng.name, groupInfoEng.group.title, groupInfoEng.group.description, groupInfoEng.group.avatarUrl, groupInfoEng.local);
    groupInfoEng.id = parseInt(result.message);
    groupInfo = groupInfoEng;
  }
  return groupInfo;
}

window.addEventListener('scroll', async () => {
  const scrollPosition = window.scrollY + window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  if (documentHeight - scrollPosition <= 100 && loading == false && page > 0) {
    loading = true;
    page -= 1;
    threads = await getThreads(groupid, page);
    appendThreadPageHtml(threads);
    loading = false;
  }
});

function appendThreadPageHtml(threads) {
  for (let i = threads.length - 1; i >= 0; i--) {
    const thread = threads[i];
    posts.appendChild(createMessageHtml(thread.text, thread.username, thread.usernameColor, thread.createdUtcAt, thread.countMessages, thread.countViews, "?thread=" + thread.titleUrl + "-" + thread.id, thread.userAvatarUrl, thread.id, true, thread.attachments));
  }
}

async function appendCommentPageHtml(comments) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    posts.appendChild(createMessageHtml(comment.text, comment.username, comment.usernameColor, comment.createdUtcAt, comment.countMessages, comment.countViews, null, comment.userAvatarUrl, comment.id, false, comment.attachments));
  }
}

function createMessageHtml(text, username, usernameColor, createdUtcAt, countComments, countViews, url = null, avatarUrl = null, id = null, isThread = false, mediaUrls = []) {
  const postDiv = document.createElement('div');
  postDiv.className = 'post-item';
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'post-avatar';
  if (avatarUrl && avatarUrl.trim() !== '') {
    avatarDiv.style.backgroundImage = `url('${avatarUrl}')`;
    avatarDiv.style.backgroundSize = 'cover';
    avatarDiv.style.backgroundPosition = 'center';
  } else {
    avatarDiv.textContent = username ? username.charAt(0).toUpperCase() : '';
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = ((hash << 5) - hash) + username.charCodeAt(i);
    const hue = Math.abs(hash % 360);
    avatarDiv.style.background = `radial-gradient(circle at 30% 30%, hsl(${hue}, 70%, 35%), hsl(${hue}, 70%, 35%))`;
    avatarDiv.style.fontWeight = 'bold';
  }
  const mainDiv = document.createElement('div');
  mainDiv.className = 'post-main';
  const headerDiv = document.createElement('div');
  headerDiv.className = 'post-header';
  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'post-username';
  usernameSpan.style.color = usernameColor || '#000';
  usernameSpan.textContent = username || 'anonymous';
  const dateSpan = document.createElement('span');
  dateSpan.className = 'post-date';
  const formattedDate = formatPostDate(createdUtcAt);
  dateSpan.textContent = formattedDate;
  headerDiv.appendChild(usernameSpan);
  headerDiv.appendChild(dateSpan);
  const contentDiv = document.createElement('div');
  contentDiv.className = 'post-content';
  contentDiv.textContent = text || '';
  if (mediaUrls && mediaUrls.length > 0) {
    const mediaDiv = document.createElement('div');
    mediaDiv.className = 'post-media';
    for (const mediaUrl of mediaUrls) {
      const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) || mediaUrl.includes('video');
      const isImage = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || mediaUrl.includes('image');
      const isAudio = mediaUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/i) || mediaUrl.includes('audio');
      if (isVideo) {
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.controls = true;
        video.className = 'post-media-content'
        mediaDiv.appendChild(video);
      } else if (isImage) {
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.className = 'post-media-content'
        img.onclick = () => window.open(mediaUrl, '_blank');
        mediaDiv.appendChild(img);
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.src = mediaUrl;
        audio.controls = true;
        audio.className = 'post-audio-player';
        audio.preload = 'metadata';
        audio.playsInline = true;
        mediaDiv.appendChild(audio);
      } else {
        const fileLink = document.createElement('a');
        fileLink.href = mediaUrl;
        fileLink.textContent = `📎 ${mediaUrl.split('/').pop() || 'File'}`;
        fileLink.target = '_blank';
        fileLink.style.color = '#B3E31C';
        fileLink.style.display = 'block';
        fileLink.style.padding = '8px';
        fileLink.style.background = '#1a1a1e';
        fileLink.style.borderRadius = '8px';
        fileLink.style.textDecoration = 'none';
        mediaDiv.appendChild(fileLink);
      }
    }
    contentDiv.appendChild(mediaDiv);
  }
  mainDiv.appendChild(headerDiv);
  mainDiv.appendChild(contentDiv);
  if (isThread) {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'post-stats';
    const commentsItem = document.createElement('a');
    commentsItem.href = url;
    commentsItem.className = 'post-stat-item';
    commentsItem.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 12h18M12 3v18"></path>
      </svg>
      <span class="post-stat-count">${parseInt(countComments) ?? 0}</span>
      <span>comments</span>
    `;
    const viewsItem = document.createElement('div');
    viewsItem.className = 'post-stat-item';
    viewsItem.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span class="post-stat-count">${parseInt(countViews) ?? 0}</span>
      <span>views</span>
    `;
    statsDiv.appendChild(commentsItem);
    statsDiv.appendChild(viewsItem);
    mainDiv.appendChild(statsDiv);
    postDiv.dataset.id = id;
  }
  postDiv.appendChild(avatarDiv);
  postDiv.appendChild(mainDiv);
  return postDiv;
}

async function watchWrapperThreads(threadIds) {
  await watchThreads(threadIds.join(','));
}

function setGroups(groups) {
  for (let url in groups) {
    let [title, avatarUrl] = groups[url];
    let link = document.createElement('a');
    link.href = url;
    link.className = 'sidebar-item';
    let avatarDiv = document.createElement('img');
    avatarDiv.className = 'sidebar-item-image';
    avatarDiv.textContent = title.charAt(0).toUpperCase();
    avatarDiv.src = `${avatarUrl}`;
    avatarDiv.onerror = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.src = canvas.toDataURL();
    };
    let titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    link.appendChild(avatarDiv);
    link.appendChild(titleSpan);
    sidebarLinks.appendChild(link);
  }
}

function updateAttachmentPreview() {
  attachmentPreviewArea.innerHTML = '';
  for (let i = 0; i < attachedFiles.length; i++) {
    const file = attachedFiles[i];
    const previewDiv = document.createElement('div');
    previewDiv.className = 'attach-preview-item';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'attach-remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = (function(index) {
      return function() {
        attachedFiles.splice(index, 1);
        updateAttachmentPreview();
      };
    })(i);
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.className = 'attach-preview-img';
      img.src = URL.createObjectURL(file);
      previewDiv.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.className = 'attach-preview-video';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      previewDiv.appendChild(video);
    } else {
      const fileDiv = document.createElement('div');
      fileDiv.className = 'attach-preview-file';
      fileDiv.textContent = file.name.length > 15 ? file.name.slice(0, 12) + '...' : file.name;
      previewDiv.appendChild(fileDiv);
    }
    previewDiv.appendChild(removeBtn);
    attachmentPreviewArea.appendChild(previewDiv);
  }
}

// image/*,video/*,audio/*,application/pdf,.txt,.zip,.rar
attachFileBtn.addEventListener('click', function() {
  const input = document.getElementById('attachFileInput');
  input.type = 'file';
  input.multiple = true;
  input.accept = '*';
  input.onchange = async function(e) {
    for (const file of Array.from(e.target.files)) {
      attachedFiles.push(file);
    }
    updateAttachmentPreview();
  };
  input.click();
});

archivedSettingBtn.addEventListener('click', function (e) {
  if (isPressArchive) {
    sidebarLinks.querySelectorAll('.sidebar-item').forEach(item => item.remove());
    setGroups(groupsFavorite);
    isPressArchive = !isPressArchive;
  } else if (Object.keys(groupsArchived).length > 0) {
    sidebarLinks.querySelectorAll('.sidebar-item').forEach(item => item.remove());
    setGroups(groupsArchived);
    isPressArchive = !isPressArchive;
  }
});

burgerMenuBtn.addEventListener('click', function (e) {
  if (sidebarLeft.style.transform.includes("translateX")) {
    sidebarLeft.style.transform = "";
    mainContent.classList.remove('blurred');
  } else {
    sidebarLeft.style.transform = "translateX(0)";
    mainContent.classList.add('blurred');
  }
  e.stopPropagation();
});

inputTextareaThread.addEventListener('input', function () {
  this.style.height = 'auto';
  const newHeight = Math.min(this.scrollHeight, 130);
  this.style.height = newHeight + 'px';
});

inputSendThreadBtn.addEventListener('click', async function() {
  const text = inputTextareaThread.value.trim();
  if (text === "" && attachedFiles.length === 0) return;
  const uploadedUrls = [];
  for (const file of attachedFiles) {
    try {
      const compressedFile = await compressAggressive(file);
      const url = await uploadFile(compressedFile);
      if (url && url !== '') {
        uploadedUrls.push(url);
      }
    } catch (error) {}
  }
  const datetime = new Date();
  const urlTime = "-" + datetime.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '-');
  posts.appendChild(createMessageHtml(text, username, color, datetime, 0, 1, "", avatar, 0, true, uploadedUrls));
  await createThread(text, toSlug(text.slice(0, 120)) + urlTime, groupid, username, color, avatar, local, uploadedUrls);
  //await createComment(126, username, color, avatar, text, uploadedUrls);
  posts.scrollTop = posts.scrollHeight;
  inputTextareaThread.value = '';
  attachedFiles = [];
  updateAttachmentPreview();
  inputTextareaThread.style.height = 'auto';
});

const profileSettingBtn = document.getElementById('profileSettingBtn');
const modalUploadAvatarBtn = document.getElementById('modalUploadAvatarBtn');
const modalSaveProfileBtn = document.getElementById('modalSaveProfileBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalProfile = document.getElementById('modalProfile');
const modalUsername = document.getElementById('modalUsername');
const modalColor = document.getElementById('modalColor');
const modalToken = document.getElementById('modalToken');
const modalAvatarInput = document.getElementById('modalAvatarInput');

modalProfile.addEventListener('click', function (e) {
  if (e.target === modalProfile) {
    modalProfile.classList.remove('active');
  }
});

modalCloseBtn.addEventListener('click', function (e) {
  modalProfile.classList.remove('active');
});

modalCancelBtn.addEventListener('click', function (e) {
  modalProfile.classList.remove('active');
});

mainContent.addEventListener('click', function (e) {
  modalProfile.classList.remove('active');
  if (sidebarLeft.style.transform.includes('translateX')) {
    sidebarLeft.style.transform = '';
    mainContent.classList.remove('blurred');
  }
});

profileSettingBtn.addEventListener('click', function (e) {
  modalProfile.classList.add('active');
  sidebarLeft.style.transform = '';
  mainContent.classList.remove('blurred');
});

modalAvatarInput.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const compressedFile = await compressImage(file, 150, 150);
  const reader = new FileReader();
  reader.onload = function(e) {
    modalUploadAvatarBtn.style.backgroundImage = `url('${e.target.result}')`;
  };
  reader.readAsDataURL(compressedFile);
});

modalSaveProfileBtn.addEventListener('click', async function (e) {
  username = modalUsername.value;
  color = modalColor.value;
  token = modalToken.value;
  const file = modalAvatarInput.files[0];
  if (file) {
    avatar = await uploadFile(await compressImage(file, 150, 150));
    if (avatar != undefined && avatar != '' && avatar != ' ') {
      modalUploadAvatarBtn.style.backgroundImage = `url('${avatar}')`;
      localStorage.setItem('avatar', avatar);
    }
  }
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
  localStorage.setItem('color', color);
  localStorage.setItem('localui', localui);
  modalProfile.classList.remove('active');
});