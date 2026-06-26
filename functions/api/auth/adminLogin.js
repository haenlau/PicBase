import { fetchSecurityConfig } from "../../utils/sysConfig.js";
import { verifyPassword, rehashIfNeeded } from "../../utils/auth/passwordHash.js";
import { createSession } from "../../utils/auth/sessionManager.js";
import { checkLoginRateLimit, clearLoginFailures, recordLoginFailure } from "../../utils/auth/loginRateLimit.js";
import { getDatabase } from "../../utils/databaseAdapter.js";

export async function onRequestPost(context) {
    const { request, env } = context;

    const { username, password } = await request.json();
    const rateLimitScope = 'admin';
    const rateLimitIdentifier = '';
    const rateLimit = await checkLoginRateLimit(env, request, rateLimitScope, rateLimitIdentifier);
    if (rateLimit.limited) {
        return new Response(JSON.stringify({ error: 'Too many login attempts' }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(rateLimit.retryAfter),
            },
        });
    }

    // 读取安全设置
    let securityConfig;
    try {
        securityConfig = await fetchSecurityConfig(env, { throwOnError: true });
    } catch (error) {
        console.error('Admin login blocked because security config could not be loaded:', error);
        return new Response(JSON.stringify({ error: 'Security config unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const adminUsername = securityConfig.auth.admin.adminUsername;
    const adminPassword = securityConfig.auth.admin.adminPassword;

    const usernameConfigured = !!(adminUsername && adminUsername.trim());
    const passwordConfigured = !!(adminPassword && adminPassword.trim());
    const adminConfigured = usernameConfigured || passwordConfigured;

    // 管理员未配置，无需认证，直接创建会话
    if (!adminConfigured) {
        const { cookie } = await createSession(env, 'admin', '', request);
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookie,
            },
        });
    }

    // 如果设置了用户名，则验证用户名
    if (usernameConfigured && username !== adminUsername) {
        await recordLoginFailure(env, request, rateLimitScope, rateLimitIdentifier);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 如果设置了密码，则验证密码
    if (passwordConfigured) {
        const passwordMatch = await verifyPassword(password, adminPassword);
        if (!passwordMatch) {
            await recordLoginFailure(env, request, rateLimitScope, rateLimitIdentifier);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 登录成功后，自动升级旧版哈希为 PBKDF2
        await rehashIfNeeded(getDatabase(env), password, adminPassword, 'auth.admin.adminPassword');
    }

    // 创建会话并通过 HttpOnly Cookie 返回
    await clearLoginFailures(env, request, rateLimitScope, rateLimitIdentifier);
    const { cookie } = await createSession(env, 'admin', username || '', request);

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookie,
        },
    });
}
