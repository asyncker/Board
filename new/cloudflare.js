export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const path = new URL(request.url).pathname;
    try {
      if (request.method === 'GET' && path === '/api/v1/group/list') {
        return await handelGetGroups(request, env, corsHeaders);
      } else if (request.method === 'GET' && path === '/api/v1/thread/list') {
        return await handelGetThreads(request, env, corsHeaders);
      } else if (request.method === 'GET' && path === '/api/v1/comment/list') {
        return await handelGetComments(request, env, corsHeaders);
      } else if (request.method === 'GET' && path === '/api/v1/thread/details') {
        return await handelGetDetailsThreads(request, env, corsHeaders);
      } else if (request.method === 'GET' && path === '/api/v1/comment/details') {
        return await handelGetDetailsComments(request, env, corsHeaders);
      } else if (request.method === 'GET' && path === '/api/v1/thread/watch') {
        return await handelGetThreadsWatchs(request, env, corsHeaders);
      } else if (request.method === 'POST' && path === '/api/v1/group/create') {
        return await handelCreateGroup(request, env, corsHeaders);
      } else if (request.method === 'POST' && path === '/api/v1/thread/create') {
        return await handelCreateThread(request, env, corsHeaders);
      } else if (request.method === 'POST' && path === '/api/v1/comment/create') {
        return await handelCreateComment(request, env, corsHeaders);
      } else if (request.method === 'GET' && path === '/secretinitdatabasepls') {
        return await handelInitDatabase(env, corsHeaders);
      } else {
        return new Response('', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      return new Response('{"success":false,"error":{"code":500,"message":"Internal server error"}}', { status: 500, headers: corsHeaders });
    }
  }
};

function convertToIso8601superfast(datetime) {
  return datetime.replace(' ', 'T') + '.100000Z';
}

async function createGroup(env, data) {
  try {
    const result = await env.DB.prepare(
      'INSERT INTO `Groups`(`name`, `title`, `description`, `avatarUrl`, `local`, `countMessages`, `countViews`) VALUES (?, ?, ?, ?, ?, 0, 0)'
    ).bind(data.name, data.title, data.description, data.avatarUrl, data.local).run();
    return { success: true, id: result.meta.last_row_id };
  } catch (error) {
    throw new Error('Group already exists');
  }
}

async function createThread(env, data) {
  const datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const attachments = data.attachments?.filter(Boolean).join(",") || "";
  const count = 1 + parseInt((await env.DB.prepare(`SELECT COUNT(*) as count FROM Threads WHERE groupId = ?`).bind(data.groupId).first()).count);
  const result = await env.DB.prepare(
    'INSERT INTO `Threads`(`titleUrl`, `groupId`, `username`, `usernameColor`, `userAvatarUrl`, `text`, `createdUtcAt`, `local`, `emoji`, `attachments`, `countMessages`, `countViews`, `countLike`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)'
  ).bind(data.titleUrl, data.groupId, data.username, data.usernameColor, data.userAvatarUrl, data.text, datetime, data.local, '', attachments, 0).run();
  await env.DB.prepare('UPDATE `Groups` SET countMessages = ? WHERE id = ?').bind(count, data.groupId).run();
  const threadId = result.meta.last_row_id;
  return { success: true, id: threadId };
}

async function createComment(env, data) {
  const datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const attachments = data.attachments?.filter(Boolean).join(",") || "";
  const count = 1 + parseInt((await env.DB.prepare(`SELECT COUNT(*) as count FROM Comments WHERE threadId = ?`).bind(data.threadId).first()).count);
  const result = await env.DB.prepare(
    'INSERT INTO `Comments`(`threadId`, `username`, `usernameColor`, `userAvatarUrl`, `text`, `createdUtcAt`, `emoji`, `attachments`, `countLike`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
  ).bind(data.threadId, data.username, data.usernameColor, data.userAvatarUrl, data.text, datetime, '', attachments).run();
  await env.DB.prepare('UPDATE `Threads` SET countMessages = ? WHERE id = ?').bind(count, data.threadId).run();
  const commentId = result.meta.last_row_id;
  return { success: true, id: commentId };
}

async function getGroupById(env, groupId) {
  const result = await env.DB.prepare('SELECT * FROM `Groups` WHERE `id` = ?').bind(groupId).first();
  return result;
}

async function getGroupByName(env, name) {
  const result = await env.DB.prepare('SELECT * FROM `Groups` WHERE `name` = ?').bind(name).first();
  return result;
}

async function getThreadById(env, threadId) {
  const result = await env.DB.prepare('SELECT * FROM `Threads` WHERE `id` = ?').bind(threadId).first();
  return result;
}

async function getThreadPage(env, groupId, page) {
  const limit = 100;
  const offset = page * limit;
  const threads = await env.DB.prepare(`
    SELECT 
      m.id,
      m.groupId,
      m.username,
      m.usernameColor,
      m.userAvatarUrl,
      m.text,
      m.createdUtcAt,
      m.titleUrl,
      m.local,
      m.countMessages,
      m.countViews,
      m.countLike,
      m.attachments
    FROM Threads m
    WHERE m.groupId = ?
    ORDER BY m.id ASC
    LIMIT ? OFFSET ?
  `).bind(groupId, limit, offset).all();
  const threadList = threads.results.map(msg => {
    let attachments = [];
    if (msg.attachments) {
      attachments = msg.attachments.split(',');
    }
    return {
      id: msg.id,
      username: msg.username,
      usernameColor: msg.usernameColor,
      userAvatarUrl: msg.userAvatarUrl,
      text: msg.text,
      createdUtcAt: convertToIso8601superfast(msg.createdUtcAt),
      titleUrl: msg.titleUrl,
      countViews: msg.countViews,
      countMessages: msg.countMessages,
      local: msg.local,
      attachments: attachments
    };
  });
  return threadList;
}

async function getCommentPage(env, threadId, page) {
  const limit = 100;
  const offset = page * limit;
  const comments = await env.DB.prepare(`
    SELECT 
      m.id,
      m.threadId,
      m.username,
      m.usernameColor,
      m.userAvatarUrl,
      m.text,
      m.createdUtcAt,
      m.attachments
    FROM Comments m
    WHERE m.threadId = ?
    ORDER BY m.id ASC
    LIMIT ? OFFSET ?
  `).bind(threadId, limit, offset).all();
  const commentList = comments.results.map(msg => {
    return {
      id: msg.id,
      username: msg.username,
      usernameColor: msg.usernameColor,
      userAvatarUrl: msg.userAvatarUrl,
      text: msg.text,
      createdUtcAt: convertToIso8601superfast(msg.createdUtcAt),
      attachments: msg.attachments
    };
  });
  return commentList;
}

async function getGroups(env, searchTitle, page = 0) {
  const limit = 100;
  const offset = page * limit;
  let query = 'SELECT id, name, title, description, avatarUrl, local, countMessages, countViews FROM `Groups`';
  const params = [];
  if (searchTitle && searchTitle.trim() !== '') {
    query += ' WHERE title LIKE ?';
    params.push(`%${searchTitle}%`);
  }
  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const result = await env.DB.prepare(query).bind(...params).all();
  return result.results;
}

async function getThreadsWatchs(env, threadIds) {
  const ids = threadIds.split('-').filter(id => /^\d+$/.test(id));
  if (!ids.length) return false;
  const sql = `UPDATE Threads SET countViews = countViews + 1 WHERE id IN (${ids.map(() => '?').join(',')})`;
  await env.DB.prepare(sql).bind(...ids).run();
  //const sql = 'UPDATE `Threads` SET countViews = countViews + 1 WHERE id IN (' + threadIds.replace("-", ",") + ')';
  //await env.DB.prepare(sql).run();
  return true;
}

async function handelCreateGroup(request, env, corsHeaders) {
  try {
    const input = await request.json();
    if (!input.name || input.name.trim() === '') {
      return new Response('{"success":false,"error":{"code":400,"message":"Group name cannot be null or empty"}}', { status: 400, headers: corsHeaders });
    }
    if (input.local.length != 2) {
      return new Response('{"success":false,"error":{"code":400,"message":"Local must contain 2 characters"}}', { status: 400, headers: corsHeaders });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(input.name)) {
      return new Response('{"success":false,"error":{"code":500,"message":"Only English group name"}}', { status: 500, headers: corsHeaders });
    }
    const result = await createGroup(env, input);
    return new Response('{"success":true,"data":{"code":200,"message":"' + result.id + '"}}', { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response('{"success":false,"error":{"code":404,"message":"Group is exist"}}', { status: 404, headers: corsHeaders });
  }
}

async function handelCreateThread(request, env, corsHeaders) {
  try {
    const input = await request.json();
    if (!input.titleUrl || input.titleUrl.trim() === '') {
      return new Response('{"success":false,"error":{"code":400,"message":"Thread name cannot be null or empty"}}', { status: 400, headers: corsHeaders });
    }
    if (input.local.length != 2) {
      return new Response('{"success":false,"error":{"code":400,"message":"Local must contain 2 characters"}}', { status: 400, headers: corsHeaders });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(input.titleUrl)) {
      return new Response('{"success":false,"error":{"code":500,"message":"Only English thread name"}}', { status: 500, headers: corsHeaders });
    }
    const result = await createThread(env, input);
    return new Response('{"success":true,"data":{"code":200,"message":"' + result.id + '"}}', { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response('{"success":false,"error":{"code":404,"message":"Thread create error"}}', { status: 404, headers: corsHeaders });
  }
}

async function handelCreateComment(request, env, corsHeaders) {
  try {
    const input = await request.json();
    const result = await createComment(env, input);
    return new Response('{"success":true,"data":{"code":200,"message":"' + result.id + '"}}', { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response('{"success":false,"error":{"code":404,"message":"Comment create error"}}', { status: 404, headers: corsHeaders });
  }
}

async function handelGetGroups(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get('title');
    const page = parseInt(url.searchParams.get('page') || '0');
    const result = await getGroups(env, title, page);
    return new Response('{"success":true,"data":' + JSON.stringify(result) + '}', { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response('{"success":false,"error":{"code":500,"message":"Error list group"}}', { status: 500, headers: corsHeaders });
  }
}

async function handelGetThreads(request, env, corsHeaders) {
  const url = new URL(request.url);
  const groupId = url.searchParams.get('groupId');
  const page = parseInt(url.searchParams.get('page') || '0');
  if (!groupId || groupId.trim() === '') {
    return new Response('{"success":false,"error":{"code":400,"message":"GroupId cannot be null or empty"}}', { status: 400, headers: corsHeaders });
  }
  try {
    let result = await getThreadPage(env, groupId, page);
    return new Response('{"success":true,"data":' + JSON.stringify(result) + '}', { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response('{"success":false,"error":{"code":404,"message":"Thread not found"}}', { status: 404, headers: corsHeaders });
  }
}

async function handelGetDetailsThreads(request, env, corsHeaders) {
  const url = new URL(request.url);
  const groupName = url.searchParams.get('groupName');
  const group = await env.DB.prepare('SELECT * FROM Groups WHERE `name` = ?').bind(groupName).first();
  const countMessages = parseInt((await env.DB.prepare(`SELECT COUNT(*) as count FROM Threads WHERE groupId = ?`).bind(group.id).first()).count);
  const threads = await getThreadPage(env, group.id, parseInt(countMessages / 100));
  const result = { group: group, threads: threads };
  return new Response('{"success":true,"data":' + JSON.stringify(result) + '}', { status: 200, headers: corsHeaders });
}

async function handelGetComments(request, env, corsHeaders) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get('threadId');
  const page = parseInt(url.searchParams.get('page') || '0');
  if (!threadId || threadId.trim() === '') {
    return new Response('{"success":false,"error":{"code":400,"message":"ThreadId cannot be null or empty"}}', { status: 400, headers: corsHeaders });
  }
  try {
    let result = await getCommentPage(env, threadId, page);
    return new Response('{"success":true,"data":' + JSON.stringify(result) + '}', { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response('{"success":false,"error":{"code":404,"message":"Thread not found"}}', { status: 404, headers: corsHeaders });
  }
}

async function handelGetDetailsComments(request, env, corsHeaders) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get('threadId');
  const thread = await env.DB.prepare('SELECT * FROM Threads WHERE `id` = ?').bind(threadId).first();
  const countMessages = parseInt((await env.DB.prepare(`SELECT COUNT(*) as count FROM Comments WHERE threadId = ?`).bind(threadId).first()).count);
  const comments = await getCommentPage(env, thread.id, parseInt(countMessages / 100));
  const result = { thread: thread, comments: comments };
  return new Response('{"success":true,"data":' + JSON.stringify(result) + '}', { status: 200, headers: corsHeaders });
}

async function handelGetThreadsWatchs(request, env, corsHeaders) {
  const url = new URL(request.url);
  const threadIds = url.searchParams.get('threadIds');
  if (threadIds.length <= 1) {
    return new Response('{"success":false,"error":{"code":400,"message":"Error watch thread"}}', { status: 400, headers: corsHeaders });
  }
  const data = await getThreadsWatchs(env, threadIds);
  return new Response('{"success":true,"data":' + data + '}', { status: 200, headers: corsHeaders });
}

async function handelInitDatabase(env, corsHeaders) {
  const results = {
    groups: false,
    threads: false,
    comments: false,
    indexes: false
  };
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS \`Groups\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT,
        \`name\` varchar(256) NOT NULL,
        \`title\` varchar(2048) NOT NULL,
        \`description\` text NOT NULL,
        \`avatarUrl\` varchar(2048) NOT NULL,
        \`local\` varchar(8) NOT NULL,
        \`countMessages\` integer NOT NULL,
        \`countViews\` integer NOT NULL,
        UNIQUE(\`name\`)
      );
    `).run();
    results.groups = true;

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS \`Threads\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT,
        \`groupId\` integer NOT NULL,
        \`username\` varchar(256) NOT NULL,
        \`usernameColor\` varchar(10) NOT NULL,
        \`userAvatarUrl\` varchar(2048) NOT NULL,
        \`text\` text NOT NULL,
        \`createdUtcAt\` datetime NOT NULL,
        \`titleUrl\` varchar(256) NOT NULL,
        \`local\` varchar(8) NOT NULL,
        \`countMessages\` integer NOT NULL,
        \`countViews\` integer NOT NULL,
        \`countLike\` integer NOT NULL,
        \`attachments\` varchar(16384) NOT NULL,
        \`emoji\` varchar(128),
        FOREIGN KEY (\`groupId\`) REFERENCES \`Groups\`(\`id\`) ON DELETE CASCADE,
        UNIQUE(\`titleUrl\`)
      );
    `).run();
    results.threads = true;

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS \`Comments\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT,
        \`threadId\` integer NOT NULL,
        \`username\` varchar(256) NOT NULL,
        \`usernameColor\` varchar(10) NOT NULL,
        \`userAvatarUrl\` varchar(2048) NOT NULL,
        \`text\` text NOT NULL,
        \`createdUtcAt\` datetime NOT NULL,
        \`countLike\` integer NOT NULL,
        \`attachments\` varchar(16384) NOT NULL,
        \`emoji\` varchar(128),
        FOREIGN KEY (\`threadId\`) REFERENCES \`Threads\`(\`id\`) ON DELETE CASCADE
      );
    `).run();
    results.comments = true;

    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_groups_title_lower ON \`Groups\`(LOWER(\`title\`));`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_groups_countviews ON \`Groups\`(\`countViews\` DESC);`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_threads_group_local_id ON \`Threads\`(\`groupId\`, \`local\`, \`id\` ASC);`).run();
    results.indexes = true;
    
    const tables = await env.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `).all();

    return new Response(JSON.stringify({
      success: true,
      message: "Database initialized successfully",
      results: results,
      tables: tables.results
    }, null, 2), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: error.message,
        results: results
      }
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
