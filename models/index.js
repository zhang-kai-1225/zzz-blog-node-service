// 从数据库配置文件中导入 sequelize 实例（数据库连接对象）和 Sequelize 类（ORM 核心类）
const { sequelize, Sequelize } = require('../config/db.config');

// 创建一个空对象 用于存储所有模型、Sequelize 类和数据库连接实例。
const db = {};

db.Sequelize = Sequelize; // 存储 Sequelize 类（方便使用其静态方法，如数据类型）
db.sequelize = sequelize; // 存储数据库连接实例（方便执行同步、事务等操作）

// 导入用户模型，传入 sequelize 实例和 Sequelize 类进行初始化
db.User = require('./user.model.js')(sequelize, Sequelize);





// 定义模型之间的关系
// db.User.hasMany(db.Post, {
//     foreignKey: 'userId',
//     as: 'posts',
// })

module.exports = db;