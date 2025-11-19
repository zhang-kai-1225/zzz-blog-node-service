const db = require('../models');

async function syncDatabase() {
    try {
        // 验证连接
        await db.sequelize.authenticate();

        // 同步表结构：按依赖顺序处理，确保被关联的表先同步
        await db.sequelize.sync({
            alter: true,
            order: [
                // 1. 先处理“基础表”（无外键依赖的表）
                [db.User, 'ASC'],         // users 表（posts 依赖它）
                [db.Categroup, 'ASC'],    // categroup 表（posts 依赖它）
                // 2. 再处理“依赖表”
                [db.Post, 'ASC'],         // posts 表（依赖 users 和 categroup）
                // 其他表按实际依赖关系添加，如 Tag、PostLike 等
            ]
        });

        console.log('数据库表结构同步成功！');
    } catch (error) {
        console.error('同步失败:', error);
    }
}

syncDatabase();