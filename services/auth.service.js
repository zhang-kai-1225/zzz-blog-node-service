// 引入JWT库，用于生成和验证JSON Web Tokens（JWT）
const jwt = require('jsonwebtoken');
// 引入用户服务模块，用于处理用户相关操作
const userService = require('./user.service.js');
// 引入 Redis 工具，用于存储/删除令牌（管理令牌状态）
const redisManager = require('../utils/redis');

// JWT密钥， 实际应用中应从环境变量中获取
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';

/**
 * 认证服务层
 * 负责处理用户认证相关的操作，包括登录、注册、令牌验证等
 */
class AuthService {
    /**
     * 用户登录
     * @param {string} email - 用户邮箱
     * @param {string} password - 用户密码
     * @returns {Promise<Object>} - 返回包含令牌的登录成功消息
     */
    async login(username, password) {
        // 验证用户邮箱和密码
        const user = await userService.findByUsername(username);

        // 如果用户不存在 抛出错误
        if (!user) {
            throw new Error('用户不存在');
        }
        // 验证密码是否正确
        const isPasswordValid = userService.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('密码错误');
        }
        // 检查用户状态
        if (user.status !== 'active') {
            throw new Error('用户已被禁用');
        }
        // 更新最后登录时间
        await userService.updateLastLogin(user.id);

        // 生成令牌
        const token = this.generateToken(user);
        // 存储令牌到redis
        await this.storeToken(user.id, token);
        // 返回用户消息和令牌
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                status: user.status,
            },
            token,
        };
    }
    /**
     * 生成JWT令牌
     * @param {Object} user - 用户对象，包含用户信息
     * @returns {string} - 生成的JWT令牌
     */
    generateToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    }
    /**
     * 存储令牌到Redis
     * @param {string} userId - 用户ID
     * @param {string} token - JWT令牌
     * @returns {Promise<void>}
     */
    async storeToken(userId, token) {
        try {
            // 解析jwt过期时间
            const decoded = jwt.decode(token);
            const expiresAt = decoded.exp - Math.floor(Date.now() / 1000); // 转换为秒
            // 存储令牌到redis
            await redisManager.set(`user:${userId}`, token, expiresAt);
        } catch (error) {
            console.error('存储令牌到Redis失败:', error);
            // throw error;// 错误不影响主流程
        }
    }
}
module.exports = new AuthService();