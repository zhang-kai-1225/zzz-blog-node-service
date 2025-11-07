const { DataTypes } = require('sequelize') // 从 sequelize 库中导入数据类型枚举（用于定义模型字段的数据类型）

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [3, 50],
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
            field: 'email',
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        fullName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'full_name',
        },
        avatar: {
            type: DataTypes.STRING(255),
            defaultValue: 'default-avatar.ppg', // 默认值：未上传头像时使用默认图片
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user',
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'banned'),
            defaultValue: 'active',
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_login',
        },
    }, {
        tableName: 'users',  // 明确指定数据库表名（必填，避免 Sequelize 自动复数化导致表名不符）
        timestamps: true,    // 自动添加 createdAt（创建时间）和 updatedAt（更新时间）字段
        paranoid: false,     // 禁用软删除（若为 true，会添加 deletedAt 字段，删除时仅标记不真删）
        underscored: true,   // 自动将驼峰命名转换为下划线命名（如 createdAt → created_at）
        indexes: [           // 定义数据库索引（优化查询性能）
            {
                unique: true,
                fields: ['email'],
            },
            {
                unique: true,
                fields: ['username'],
            },
        ],
    }
    )
    return User;
}