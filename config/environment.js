const path = require('path');  // Node.js 内置模块，用于处理文件路径
const fs = require('fs');      // Node.js 内置模块，用于文件系统操作
const dotenv = require('dotenv');  // 第三方库，用于加载 .env 文件中的环境变量

/**
 * 环境配置管理类,即使使用了 env.development 这类文件，
 * 代码最终还是从 process.env 中读取配置（因为 dotenv 的作用就是将文件中的变量注入到 process.env）。
 */
class EnvironmentManager {
    // 构造函数：类实例化时自动执行
    constructor() {
        // 确定当前环境（默认 development，可通过 NODE_ENV 环境变量指定，如 production）
        this.env = process.env.NODE_ENV || 'development';
        // 用于存储最终解析后的配置
        this.config = {};
        // 加载环境配置（核心方法）
        this.loadEnvironmentConfig();
    }


    // 加载环境配置文件
    loadEnvironmentConfig() {
        // 拼接环境配置文件路径：项目根目录下的 "env.环境名"（如 env.development、env.production）
        const envFile = path.join(process.cwd(), `env.${this.env}`);

        // 检查配置文件是否存在
        if (fs.existsSync(envFile)) {
            // 存在则用 dotenv 加载该文件（将文件中的变量注入到 process.env）
            dotenv.config({ path: envFile });
            console.log(`✅ 已加载环境配置: ${envFile}`);  // 成功提示
        } else {
            // 不存在则警告，并加载默认的 .env 文件（如果有的话）
            console.warn(`⚠️  环境配置文件不存在: ${envFile}`);
            dotenv.config();  // 不指定路径时，默认加载项目根目录的 .env 文件
        }

        // 验证并整理配置（将 process.env 中的变量解析到 this.config）
        this.validateAndSetConfig();
    }


    // 验证环境变量并设置最终配置
    validateAndSetConfig() {
        // 整理配置：从 process.env 中提取变量，若无则用默认值
        this.config = {
            nodeEnv: this.env,  // 当前环境（如 development）
            port: parseInt(process.env.PORT) || 8200,  // 服务器端口（默认 8200）
            database: {  // 数据库配置
                host: process.env.DB_HOST || 'localhost',  // 数据库主机（默认 localhost）
                port: parseInt(process.env.DB_PORT) || 3306,  // 数据库端口（默认 3306）
                name: process.env.DB_NAME || 'blog_dev',  // 数据库名（默认 blog_dev）
                user: process.env.DB_USER || 'root',  // 数据库用户名（默认 root）
                password: process.env.DB_PASSWORD || 'root',  // 数据库密码（默认 root）
                dialect: 'mysql',  // 数据库类型（固定为 mysql）
                pool: this.getDatabasePool(),
                logging: this.env === 'development' ? console.log : false,
                define: {
                    underscored: true,
                    underscoredAll: true,
                },
            },
            // 可扩展其他配置（如 JWT 密钥、API 前缀等）

            // 日志配置
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                filePath: process.env.LOG_FILE_PATH || './logs',
            },
            // redis 配置
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || '',
                db: parseInt(process.env.REDIS_DB) || 1,
                url: process.env.REDIS_PASSWORD
                    ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`
                    : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`,

            },
            // CORS配置
            cors: {
                allowedOrigins: process.env.ALLOWED_ORIGINS
                    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
                    : ['http://localhost:3000'],
            },
        };
    }

    /**
     * 获取数据库连接池配置
     */
    getDatabasePool() {
        const basePool = {
            acquire: 30000,
            idle: 10000,
        };

        switch (this.env) {
            case 'development':
                return { ...basePool, max: 10, min: 0 };
            case 'test':
                return { ...basePool, max: 5, min: 0 };
            case 'production':
                return { ...basePool, max: 20, min: 5 };
            default:
                return { ...basePool, max: 10, min: 0 };
        }
    }


    // 获取配置（支持按 key 提取，如 get('port')；不填 key 则返回全部配置）
    get(key) {
        return key ? this.config[key] : this.config;
    }


    // 打印配置信息（方便启动时查看当前环境配置）
    printConfig() {
        console.log('\n========================================');
        console.log('🚀 环境配置信息');
        console.log('========================================\n');
        console.log(`环境: ${this.config.nodeEnv}`);  // 输出当前环境
        console.log(`端口: ${this.config.port}`);    // 输出服务器端口
        console.log(`数据库: ${this.config.database.host}:${this.config.database.port}`);  // 输出数据库地址
        console.log('========================================\n');
    }
}


// 导出单例实例（整个项目中共享同一个环境配置实例）
module.exports = new EnvironmentManager();