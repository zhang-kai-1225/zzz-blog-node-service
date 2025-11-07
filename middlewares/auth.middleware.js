const authService = require('../services/auth.service');


/**
 * 验证令牌中间件
 * 用于验证用户是否已经登录
 */

const verifyToken = async (req, res, next) => {
    try {
        // 从请求头获取令牌
        const authHeader = res.header.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.apiUnauthorized('未授权，请提供Bearer令牌');
        }

        // 提取令牌
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.apiUnauthorized('未授权，请提供Bearer令牌');
        }

        try {
            // 验证令牌
            const decoded = await authService.verifyToken(token);
            // 将解码后的用户信息挂载到请求对象上
            req.user = decoded;
            next();
        } catch (error) {
            return res.apiUnauthorized('令牌无效或过期');
        }
    } catch (error) {
        return res.apiServerError('令牌验证失败');
    }
}