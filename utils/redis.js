// 1. 导入依赖：Redis 客户端库、配置、日志工具
const Redis = require('ioredis');
const redisConfig = require('../config/redis.config.js'); // Redis 连接配置（如 host、port、密码）
const { logger } = require('./logger'); // 日志工具（记录连接状态、错误等）

// 2. 定义 RedisManager 类
class RedisManager {
    constructor() {
        // 初始化状态：未连接、未在连接中
        this.client = null; // Redis 客户端实例（连接成功后赋值）
        this.isConnected = false; // 是否已连接
        this.isConnecting = false; // 是否正在连接（避免重复连接）
    }

    // 连接管理相关方法（connect、ensureConnection、disconnect 等）
    // 缓存操作相关方法（set、get、del、cached 等）
}

// 3. 创建单例实例（整个项目共享一个 Redis 连接，避免重复创建）
const redisManager = new RedisManager();
module.exports = redisManager; // 导出实例，供其他地方直接使用