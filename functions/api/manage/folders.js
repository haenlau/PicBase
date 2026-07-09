// 文件夹管理 API
// GET: 获取文件夹列表
// POST: 创建文件夹
// DELETE: 删除文件夹

import { getDatabase } from '../../utils/databaseAdapter.js';

const FOLDER_PREFIX = 'manage@folders@';
const PARENT_INDEX_PREFIX = 'manage@foldersByParent@';

// CORS 跨域响应头
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env } = context;

    // OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const db = getDatabase(env);

    try {
        // GET: 获取文件夹列表
        if (request.method === 'GET') {
            const url = new URL(request.url);
            const parent = normalizeDirPath(url.searchParams.get('parent') || '');
            const recursive = url.searchParams.get('recursive') === 'true';
            const folders = recursive ? await getDescendantFolders(db, parent) : await getFolders(db, parent);

            return jsonResponse({ success: true, folders });
        }

        // POST: 创建文件夹
        if (request.method === 'POST') {
            let body;
            try {
                body = await request.json();
            } catch (error) {
                return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400);
            }

            const { name, parent = '' } = body || {};

            if (!name) {
                return errorResponse('FOLDER_NAME_REQUIRED', 'Folder name is required', 400);
            }

            const cleanName = sanitizeFolderName(name);
            if (!cleanName) {
                return errorResponse('INVALID_FOLDER_NAME', 'Invalid folder name', 400);
            }

            const cleanParent = normalizeDirPath(parent);
            const folderPath = cleanParent ? `${cleanParent}/${cleanName}` : cleanName;

            // 检查是否已存在
            const existing = await db.get(folderKey(folderPath));
            if (existing) {
                await addFolderToParentIndex(db, cleanParent, normalizeFolderRecord({
                    name: cleanName,
                    path: folderPath,
                    parent: cleanParent
                }));
                return errorResponse('FOLDER_ALREADY_EXISTS', 'Folder already exists', 409);
            }

            const folder = {
                name: cleanName,
                path: folderPath,
                parent: cleanParent,
                createdAt: Date.now()
            };

            // 创建文件夹记录，并同步父目录索引，避免下次 GET 全量扫描
            await db.put(folderKey(folderPath), JSON.stringify(folder));
            await addFolderToParentIndex(db, cleanParent, folder);

            return jsonResponse({
                success: true,
                folder: { name: cleanName, path: folderPath }
            }, 201);
        }

        // DELETE: 删除文件夹
        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const path = normalizeDirPath(url.searchParams.get('path') || '');

            if (!path) {
                return errorResponse('FOLDER_PATH_REQUIRED', 'Folder path is required', 400);
            }

            const foldersToDelete = await collectFolderTree(db, path);

            // 先删深层目录，再删父目录
            foldersToDelete.sort((a, b) => b.path.length - a.path.length);

            for (const folder of foldersToDelete) {
                await db.delete(folderKey(folder.path));
                await removeFolderFromParentIndex(db, folder.parent, folder.path);
                await db.delete(parentIndexKey(folder.path));
            }

            return jsonResponse({ success: true });
        }

        return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);

    } catch (error) {
        console.error('Folder API error:', error);
        return errorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

function errorResponse(code, message, status) {
    return jsonResponse({
        success: false,
        error: { code, message },
        message
    }, status);
}

function folderKey(path) {
    return `${FOLDER_PREFIX}${normalizeDirPath(path)}`;
}

function parentIndexKey(parent) {
    return `${PARENT_INDEX_PREFIX}${normalizeDirPath(parent)}`;
}

function normalizeDirPath(dir) {
    return (dir || '')
        .replace(/\.\./g, '_')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
        .replace(/\/{2,}/g, '/');
}

function sanitizeFolderName(name) {
    return String(name || '').replace(/[\/\\:*?"<>|]/g, '_').trim();
}

function normalizeFolderRecord(folder) {
    const path = normalizeDirPath(folder?.path || '');
    const parent = normalizeDirPath(folder?.parent || getParentPath(path));
    const name = sanitizeFolderName(folder?.name || getFolderName(path));

    return {
        name,
        path,
        parent,
        createdAt: Number(folder?.createdAt) || Date.now()
    };
}

function getParentPath(path) {
    const normalized = normalizeDirPath(path);
    const parts = normalized.split('/').filter(Boolean);
    parts.pop();
    return parts.join('/');
}

function getFolderName(path) {
    const parts = normalizeDirPath(path).split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
}

function sortFolders(folders) {
    return folders
        .filter(folder => folder.path && folder.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

async function readParentIndex(db, parent) {
    const data = await db.get(parentIndexKey(parent));
    if (!data) {
        return null;
    }

    try {
        const parsed = JSON.parse(data);
        const folders = Array.isArray(parsed) ? parsed : parsed.folders;
        if (!Array.isArray(folders)) {
            return [];
        }

        return sortFolders(folders.map(normalizeFolderRecord));
    } catch (error) {
        console.warn('Failed to parse folder parent index:', error);
        return null;
    }
}

async function writeParentIndex(db, parent, folders) {
    const normalizedParent = normalizeDirPath(parent);
    const payload = {
        version: 1,
        parent: normalizedParent,
        folders: sortFolders(folders.map(normalizeFolderRecord)),
        updatedAt: Date.now()
    };

    await db.put(parentIndexKey(normalizedParent), JSON.stringify(payload));
}

// 获取指定父目录下的文件夹。优先读父目录索引，旧数据缺索引时扫描一次并回填。
async function getFolders(db, parent) {
    const normalizedParent = normalizeDirPath(parent);
    const indexedFolders = await readParentIndex(db, normalizedParent);

    if (indexedFolders) {
        return indexedFolders;
    }

    const folders = await scanFoldersByParent(db, normalizedParent);
    await writeParentIndex(db, normalizedParent, folders);
    return folders;
}

async function scanFoldersByParent(db, parent) {
    const normalizedParent = normalizeDirPath(parent);
    const folders = [];
    let cursor = null;

    while (true) {
        const response = await db.list({
            prefix: FOLDER_PREFIX,
            limit: 1000,
            cursor
        });

        if (!response || !response.keys || !Array.isArray(response.keys)) {
            break;
        }

        for (const item of response.keys) {
            try {
                const data = await db.get(item.name);
                if (!data) continue;

                const folder = normalizeFolderRecord(JSON.parse(data));
                if (folder.parent === normalizedParent) {
                    folders.push(folder);
                }
            } catch (error) {
                // 忽略历史脏数据
            }
        }

        cursor = response.cursor;
        if (!cursor) break;
    }

    return sortFolders(folders);
}

async function addFolderToParentIndex(db, parent, folder) {
    const normalizedParent = normalizeDirPath(parent);
    const current = await readParentIndex(db, normalizedParent);
    const folders = current || await scanFoldersByParent(db, normalizedParent);
    const normalizedFolder = normalizeFolderRecord(folder);
    const merged = folders.filter(item => item.path !== normalizedFolder.path);
    merged.push(normalizedFolder);
    await writeParentIndex(db, normalizedParent, merged);
}

async function removeFolderFromParentIndex(db, parent, path) {
    const normalizedParent = normalizeDirPath(parent);
    const current = await readParentIndex(db, normalizedParent);
    const folders = current || await scanFoldersByParent(db, normalizedParent);
    const normalizedPath = normalizeDirPath(path);
    await writeParentIndex(db, normalizedParent, folders.filter(folder => folder.path !== normalizedPath));
}

async function collectFolderTree(db, rootPath) {
    const root = normalizeDirPath(rootPath);
    const rootRecord = await getFolderRecord(db, root) || {
        name: getFolderName(root),
        path: root,
        parent: getParentPath(root),
        createdAt: Date.now()
    };
    const folders = [normalizeFolderRecord(rootRecord)];
    const queue = [root];

    while (queue.length > 0) {
        const current = queue.shift();
        const children = await getFolders(db, current);

        for (const child of children) {
            folders.push(child);
            queue.push(child.path);
        }
    }

    return folders;
}

async function getDescendantFolders(db, parent) {
    const folders = [];
    const queue = [normalizeDirPath(parent)];

    while (queue.length > 0) {
        const current = queue.shift();
        const children = await getFolders(db, current);

        for (const child of children) {
            folders.push(child);
            queue.push(child.path);
        }
    }

    return sortFolders(folders);
}

async function getFolderRecord(db, path) {
    const data = await db.get(folderKey(path));
    if (!data) {
        return null;
    }

    try {
        return normalizeFolderRecord(JSON.parse(data));
    } catch (error) {
        return null;
    }
}
