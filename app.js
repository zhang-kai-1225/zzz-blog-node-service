// 导入express
const express = require('express');
const environment = require('./config/environment');
const { createServer } = require('http');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const routes = require('./routes/index');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { requestLogger, errorLogger, logger } = require('./utils/logger');
const { monitorMiddleware } = require('./utils/monitor');
const { responseMiddleware } = require('./utils/response');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger.config');
const path = require('path');
// 获取环境配置
const config = environment.get();
// 打印环境配置
environment.printConfig();

// 创建Express应用实例
const app = express();
// 创建HTTP服务器
const server = createServer(app);

// 配置 trust proxy（重要：用于正确识别客户端IP）
app.set('trust proxy', 1);
// 禁用X-Powered-By头部 
app.disable('x-powered-by');
// 确保服务器支持WebSocket升级
server.on('upgrade', (request, socket, head) => {
    logger.info('WebSocket升级请求', {
        url: request.url,
        headers: request.headers,
    });
});

// 基础中间件配置
const setupMiddleware = () => {
    // 添加安全中间件， 自动给 HTTP 响应头添加各种安全相关的配置，常见的 Web 安全风险（比如 XSS 攻击、点击劫持等）
    app.use(helmet({
        contentSecurityPolicy: false, // 禁用CSP以允许Swagger UI正常工作
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
    }));
    // 压缩中间件 压缩服务器返回给客户端的响应数据
    app.use(compression());
    // cros配置
    app.use(cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }))
    // 速率限制
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 1000, // 每个IP每个窗口内最多100个请求
        message: {
            message: '请求频率过快，请稍后重试',
            code: 429,
        },
        standardHeaders: true, // 返回RateLimit-*头
        legacyHeaders: false, // 禁用X-RateLimit-*头
        // 使用 X-Forwarded-For 头部来识别真实IP
        keyGenerator: req => {
            return req.ip || req.connection.remoteAddress;
        },
    });
    // 应用速率限制中间件
    app.use('/api', limiter);
    // 解析 JSON 请求体,自动把前端发来的 JSON 格式请求体（放在 req.body 里）解析成 JavaScript 对象，就能直接用 req.body.name 这种方式获取数据了。
    app.use(express.json({ limit: '10mb' }));
    // 添加处理表单数据的中间件 处理表单格式请求
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 自定义中间件
    app.use(requestLogger)
    app.use(monitorMiddleware);
    app.use(responseMiddleware);
}

// 路由配置
const setupRoutes = () => {
    // API 路由
    app.use('/api', routes);

    // Swagger API 文档
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(specs, {
            customCss: `
      .swagger-ui .topbar { display: none !important; }
      .swagger-ui .info .title { color: #3b4151; }
      .swagger-ui .scheme-container { background: #f7f7f7; }
    `,
            customSiteTitle: '博客系统 API 文档',
            swaggerOptions: {
                docExpansion: 'list', // 默认折叠所有接口
                filter: true, // 显示搜索框
                showRequestHeaders: true, // 显示请求头参数
                tryItOutEnabled: true, // 启用在线测试
                // 确保Swagger UI使用正确的URL
                url: '/api-docs/swagger.json',
                // 禁用HTTPS重定向
                validatorUrl: null,
                // 强制使用HTTP协议
                schemes: ['http'],
            },
        })
    );
    // 创建一个专门返回 Swagger 文档数据的接口，为 Swagger UI 页面提供 “数据源”。
    app.get('/api-docs/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(specs);
    });
    // 提供Swagger UI的静态资源
    const swaggerStaticPath = path.join(__dirname, 'node_modules', 'swagger-ui-dist');
    app.use('/api-docs', express.static(swaggerStaticPath));
    // 提供上传文件的静态资源服务
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // 根路由
    app.get('/', (req, res) => {
        res.json({
            message: '欢迎使用博客API服务',
            version: '1.0.0',
            author: 'adnaan',
            documentation: '/api-docs',
            health: '/api/system/health',
            info: '/api/system/info',
        })
    })
    // 404 处理 所有路由匹配不上的时候
    app.use(notFound);
}
// 错误处理中间件
const setupErrorHandling = () => {
    app.use(errorLogger);
    app.use(errorHandler);
}

// 服务器启动
const startServer = () => {
    const PORT = config.port;
    console.log('\n========================================');
    console.log('🚀 正在启动服务...');
    console.log('========================================\n');

    // 配置服务器超时
    server.timeout = 30000; // 30s超时
    server.keepAliveTimeout = 65000; // keep-alive超时
    server.headersTimeout = 66000; // headers超时

    // 6. 启动HTTP服务器
    server.listen(PORT, async () => {
        console.log('\n========================================');
        console.log('✅ 服务器启动完成');
        console.log('========================================\n');
        console.log(`📡 服务地址: http://localhost:${PORT}`);
        console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
        console.log(`💚 健康检查: http://localhost:${PORT}/api/system/health`);
        console.log(`📊 系统监控: http://localhost:${PORT}/status`);
        // console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
        // console.log(`🤖 AI服务: ${aiService.isServiceAvailable() ? '✅ 可用' : '❌ 不可用'}`);
        // console.log(`🔄 任务队列: ${aiTaskWorker.getStatus().isRunning ? '✅ 运行中' : '❌ 未启动'}`);
        console.log('\n========================================\n');

        // 记录到日志文件
        logger.info('🚀 服务器启动成功', {
            port: PORT,
            environment: config.nodeEnv,
            // aiService: aiService.isServiceAvailable() ? '可用' : '不可用',
            // taskWorker: aiTaskWorker.getStatus().isRunning ? '运行中' : '未启动',
        });
    });
}

// 应用配置
setupMiddleware();
setupRoutes();
setupErrorHandling();

// 启动服务器
startServer();

// 优雅关闭
async function gracefulShutdown(signal) {
    // 先打印日志：告诉开发者“收到了什么信号，开始关闭”
    logger.info(`\n========================================`);
    logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
    logger.info(`========================================\n`);

    try {
        // 1. 第一步：关闭 HTTP 服务器（停止接受新请求，处理完现有请求再关）
        logger.info('1️⃣ 关闭 HTTP 服务器...');
        await new Promise(resolve => {
            server.close(() => { // server 是之前创建的 HTTP 服务器实例
                logger.info('✅ HTTP 服务器已关闭');
                resolve(); // 关闭完成后，继续下一步
            });
        });

        // 2. 第二步：关闭 Socket.IO 实时通信服务（通知客户端后再断连）
        logger.info('2️⃣ 关闭 Socket.IO 服务...');
        await socketManager.shutdown(); // 调用之前 SocketManager 的 shutdown 方法
        // （内部会先通知所有客户端“服务器要关了”，等1秒再断连，避免前端突然报错）

        // 3. 第三步：关闭 AI 任务处理器（停止正在处理的 AI 任务，避免任务中断导致数据混乱）
        logger.info('3️⃣ 关闭 AI 任务处理器...');
        await aiTaskWorker.stop();

        // 4. 第四步：关闭数据库连接（确保所有数据库操作完成，避免数据写入一半中断）
        logger.info('4️⃣ 关闭数据库连接...');
        const { sequelize } = require('./config/db.config'); // 导入数据库实例（Sequelize 是ORM工具）
        await sequelize.close(); // 关闭数据库连接
        logger.info('✅ 数据库连接已关闭');

        // 5. 第五步：关闭 Redis 连接（Redis 可能用于缓存、任务队列，必须安全关闭）
        logger.info('5️⃣ 关闭 Redis 连接...');
        const redisManager = require('./utils/redis'); // 导入 Redis 管理工具
        await redisManager.disconnect(); // 关闭 Redis 连接
        logger.info('✅ Redis 连接已关闭');

        // 所有资源关闭完成，打印成功日志，正常退出程序
        logger.info('\n========================================');
        logger.info('✅ 优雅关闭完成');
        logger.info('========================================\n');
        process.exit(0); // 0 表示“正常退出”，告诉操作系统“程序是安全关闭的”

    } catch (error) {
        // 如果任何一步出错（比如数据库关不掉），打印错误日志，强制退出
        logger.error('❌ 优雅关闭失败:', error);
        process.exit(1); // 1 表示“异常退出”，告诉操作系统“程序关闭时出错了”
    }
}
// 1. 处理系统发送的“正常停止”信号（如服务器重启时，操作系统发送的 SIGTERM）
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 2. 处理“终端中断”信号（如开发者在终端按 Ctrl+C 停止服务）
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 3. 处理“未捕获的异常”（如代码里有 bug 没写 try/catch，导致程序要崩溃时）
process.on('uncaughtException', error => {
    logger.error('❌ 未捕获的异常:', error);
    // gracefulShutdown('uncaughtException');
});

// 4. 处理“未处理的 Promise 拒绝”（如 Promise 没写 .catch()，导致异步错误没处理时）
process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ 未处理的 Promise 拒绝:', reason);
    // gracefulShutdown('unhandledRejection');
});

module.exports = app;