const environment = require('./environment');

// 获取Redis配置
const redisConfig = environment.get('redis');

// ioredis 客户端配置
module.exports = {
    // 基础连接配置
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,

    // iorediso 特定配置 -优化超时设置
    connectTimeout: 30000, // 增加连接超时到30s
    commandTimeout: 30000, // 增加命令超时到10s
    retryDelayOnFailure: 100, // 增加失败重试延迟到100ms
    maxRetriesPerRequest: 5, // 增加最大重试次数到5次
    lazyConnect: false, // 改为立即连接， 避免懒加载导致的延迟
    keepAlive: 30000, // 保持连接活跃， 60s 一次心跳

    // 重连策略-- 更积极的重连
    retryStrategy: (times) => {
        if (times > 20) {
            // 增加重连次数
            return null;
        }
        // 指数退避策略
        return Math.min(times * 50, 30000);
    },
    // 事件配置
    enableAutoPipelining: true,
    enableOfflineQueue: true, // 启用离线队列

    // 连接池配置
    family: 4, // 使用 IPv4 连接
    // 健康检查
    maxLodingTimeout: 5000,
    // 如果有URL，优先使用URL
    ...(redisConfig.url && {
        // 从URL中解析配置（ioredis会自动处理）
        connectionString: redisConfig.url,
    })
}

