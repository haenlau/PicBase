import { fetchSecurityConfig } from "../../utils/sysConfig.js";
import { verifyPassword, rehashIfNeeded } from "../../utils/auth/passwordHash.js";
import { createSession } from "../../utils/auth/sessionManager.js";
import { checkLoginRateLimit, clearLoginFailures, recordLoginFailure } from "../../utils/auth/loginRateLimit.js";
import { getDatabase } from "../../utils/databaseAdapter.js";

export async function onRequestPost(context) {
    const { request, env } = context;

    const jsonRequest = await request.json();
    const authCode = jsonRequest.authCode;
    const rateLimitScope = 'user';
    const rateLimit = await checkLoginRateLimit(env, request, rateLimitScope);
    if (rateLimit.limited) {
        return new Response('Too many login attempts', {
            status: 429,
            headers: { 'Retry-After': String(rateLimit.retryAfter) },
        });
    }

    // 读取安全设置
    let securityConfig;
    try {
        securityConfig = await fetchSecurityConfig(env, { throwOnError: true });
    } catch (error) {
        console.error('User login blocked because security config could not be loaded:', error);
        return new Response('Security config unavailable', { status: 503 });
    }
    const rightAuthCode = securityConfig.auth.user.authCode;

    // 验证 authCode（兼容明文、SHA-256 和 PBKDF2 三种存储格式）
    if (rightAuthCode !== undefined && rightAuthCode !== '') {
        const isValid = await verifyPassword(authCode, rightAuthCode);
        if (!isValid) {
            await recordLoginFailure(env, request, rateLimitScope);
            return new Response('Unauthorized', { status: 401 });
        }

        // 登录成功后，自动升级旧版哈希为 PBKDF2
        await rehashIfNeeded(getDatabase(env), authCode, rightAuthCode, 'auth.user.authCode');
    }

    // 创建会话并通过 HttpOnly Cookie 返回
    await clearLoginFailures(env, request, rateLimitScope);
    const { cookie } = await createSession(env, 'user', '', request);

    return new Response('Login success', {
        status: 200,
        headers: {
            'Set-Cookie': cookie,
        },
    });
}
