// 重置安全配置 - 仅在未认证时可用
export async function onRequestPost(context) {
    const { env } = context;
    const { getDatabase } = await import('../../utils/databaseAdapter.js');
    
    const db = getDatabase(env);
    
    try {
        // 删除安全配置
        await db.delete('manage@sysConfig@security');
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Security config reset. You can now login without credentials.' 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Failed to reset config',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
