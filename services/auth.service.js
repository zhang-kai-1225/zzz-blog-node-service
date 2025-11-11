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
     * 用户注册
     * @param {Object} userData - 用户注册数据，包含用户名、密码、邮箱等
     * @returns {Promise<Object>} - 返回注册成功的用户信息
     */
    async register(userData) {
        // 检查用户名是否已存在
        const existingUser = await userService.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('用户名已存在');
        }
        // 检查邮箱是否已存在
        const existingEmail = await userService.findByEmail(userData.email);
        if (existingEmail) {
            throw new Error('邮箱已存在');
        }
        // 创建新用户
        const user = await userService.createUser(userData);
        // 生成令牌
        const token = this.generateToken(user);
        // 存储令牌到Redis
        await this.storeToken(user.id, token);
        // 返回用户信息和令牌
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
        }

    }
    /**
     * 用户登出
     * @param {number} userId - 用户ID（字符串或数字类型）
     * @returns {Promise<boolean>} 登出结果
     * 
     */
    async logout(userId) {
        try {
            // 删除redis中的令牌
            await redisManager.del(`user:${userId}`);
            return true;
        } catch (error) {
            console.error('删除令牌失败:', error.message);
            return true; // 登出成功，即使删除失败也返回成功， 不影响用户体验
        }
    }

    /**
     * 验证令牌
     * @param {string} token -JWT令牌
     * @returns {Promise<Object>} - 解码后的令牌数据
     */
    async verifyToken(token) {
        try {
            // 解码令牌
            const decoded = jwt.verify(token, JWT_SECRET);
            // 从Redis中获取存储的令牌
            const storedToken = await redisManager.get(`user:${decoded.id}:token`);
            // 验证令牌是否存在于Redis中
            if (!storedToken || storedToken !== token) {
                throw new Error('令牌已失效');
            }
            return decoded;
        } catch (error) {
            console.error('令牌验证失败:', error.message);
            if (error.message === 'TokenExpiredError') {
                throw error;
            } else if (error.message === 'JsonWebTokenError') {
                throw error;
            } else {
                throw error;
            }
        }
    }
    /**
     * 刷新令牌
     * @param {string} token - 当前令牌
     * @returns {Promise<Object>} - 刷新后的令牌数据
     */
    async refreshToken(token) {
        try {
            // 验证当前令牌
            const decoded = await this.verifyToken(token);
            // 获取用户信息
            const user = await userService.findById(decoded.id);
            // 如果用户不存在 抛出错误
            if (!user) {
                throw new Error('用户不存在');
            }
            // 生成新令牌
            const newToken = this.generateToken(user);
            // 更新Redis中的令牌
            await this.storeToken(user.id, newToken);
            return { token: newToken };
        } catch (error) {
            throw new Error('刷新令牌失败');
        }
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