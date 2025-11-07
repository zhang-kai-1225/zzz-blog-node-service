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

    // iorediso
}