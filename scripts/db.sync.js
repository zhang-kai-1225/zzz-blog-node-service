
const db = require('../models');

async function syncDatabase() {
    try {
        // 验证连接
        await db.sequelize.authenticate();

        // 同步表结构
        await db.sequelize.sync({ alter: true });

        console.log('数据库表结构同步成功！');
    } catch (error) {
        console.error('同步失败:', error);
    }
}

syncDatabase();