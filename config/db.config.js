const { Sequelize } = require('sequelize');  // 从 sequelize 库中导入 Sequelize 类（ORM 核心类）
const environment = require('./environment');  // 导入之前定义的环境配置管理器（用于获取数据库配置）

// 从环境配置中获取数据相关的配置（如主机，端口，用户名等）
const dbConfig = environment.get('database');
// 创建Sequelize实例(即数据库连接实例)

const sequelize = new Sequelize(
    dbConfig.name,    // 第一个参数：数据库名称（如 blog_dev）
    dbConfig.user,    // 第二个参数：数据库用户名（如 root）
    dbConfig.password,// 第三个参数：数据库密码
    {                 // 第四个参数：配置选项对象
        host: dbConfig.host,    // 数据库主机地址（如 localhost）
        port: dbConfig.port,    // 数据库端口（如 3306）
        dialect: dbConfig.dialect,  // 数据库类型（这里是 mysql）
        pool: dbConfig.pool,    // 数据库连接池配置（从环境配置中获取，区分开发/生产环境）
        logging: dbConfig.logging,  // 是否打印 SQL 日志（开发环境打印，生产环境关闭）
        define: dbConfig.define,    // 模型定义的全局配置（如下划线命名规则）
    }
)
module.exports = {
    sequelize,    // 导出 Sequelize 实例（用于执行数据库操作，如查询、同步模型等）
    Sequelize,    // 导出 Sequelize 类（方便在其他地方使用 Sequelize 的静态方法，如定义数据类型）
    config: dbConfig,  // 导出数据库配置对象（方便其他地方获取配置信息）
}