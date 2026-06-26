// 文件夹管理 API
// GET: 获取文件夹列表
// POST: 创建文件夹
// DELETE: 删除文件夹

import { getDatabase } from '../../utils/databaseAdapter.js';

const FOLDER_PREFIX = 'manage@folders@';

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
            const parent = url.searchParams.get('parent') || '';
            
            const folders = await getFolders(db, parent);
            
            return new Response(JSON.stringify({ folders }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // POST: 创建文件夹
        if (request.method === 'POST') {
            const body = await request.json();
            const { name, parent = '' } = body;
            
            if (!name) {
                return new Response(JSON.stringify({ error: 'Folder name is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // 清理文件夹名称
            const cleanName = name.replace(/[\/\\:*?"<>|]/g, '_').trim();
            if (!cleanName) {
                return new Response(JSON.stringify({ error: 'Invalid folder name' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            const folderPath = parent ? `${parent}/${cleanName}` : cleanName;
            
            // 检查是否已存在
            const existing = await db.get(`${FOLDER_PREFIX}${folderPath}`);
            if (existing) {
                return new Response(JSON.stringify({ error: 'Folder already exists' }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // 创建文件夹记录
            await db.put(`${FOLDER_PREFIX}${folderPath}`, JSON.stringify({
                name: cleanName,
                path: folderPath,
                parent: parent,
                createdAt: Date.now()
            }));

            return new Response(JSON.stringify({ 
                success: true, 
                folder: { name: cleanName, path: folderPath }
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // DELETE: 删除文件夹
        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const path = url.searchParams.get('path');
            
            if (!path) {
                return new Response(JSON.stringify({ error: 'Folder path is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // 删除文件夹记录
            await db.delete(`${FOLDER_PREFIX}${path}`);
            
            // 删除子文件夹（递归）
            const subFolders = await getFolders(db, path);
            for (const sub of subFolders) {
                await db.delete(`${FOLDER_PREFIX}${sub.path}`);
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Folder API error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// 获取指定父目录下的文件夹
async function getFolders(db, parent) {
    const folders = [];
    let cursor = null;
    
    while (true) {
        const response = await db.list({
            prefix: FOLDER_PREFIX,
            limit: 1000,
            cursor: cursor
        });
        
        if (!response || !response.keys || !Array.isArray(response.keys)) {
            break;
        }
        
        for (const item of response.keys) {
            try {
                const data = await db.get(item.name);
                if (data) {
                    const folder = JSON.parse(data);
                    if (folder.parent === parent) {
                        folders.push(folder)
                    }
                }
            } catch (e) {
                // 忽略解析错误
            }
        }
        
        cursor = response.cursor;
        if (!cursor) break;
    }
    
    // 按名称排序
    folders.sort((a, b) => a.name.localeCompare(b.name));
    
    return folders;
}
