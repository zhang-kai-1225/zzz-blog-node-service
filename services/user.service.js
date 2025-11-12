const { User } = require('../models/index.js');
const bcrypt = require('bcryptjs'); // 密码加密/验证库（处理用户密码安全）
/**
 * 用户服务层
 * 处理用户相关的业务逻辑 —— 类功能描述注释
 */
class UserService {
    /**
     * 根据用户名查询用户
     * @param {string} username - 用户名
     * @returns {Promise<Object|null>} - 返回查询到的用户实例（如果存在），否则返回 null
     */
    async findByUsername(username) {
        console.log('username', username);
        return await User.findOne({
            where: {
                username,
            }
        });
    }
    /**
     * 根据邮箱查询用户
     * @param {string} email - 邮箱
     * @returns {Promise<Object|null>} - 返回查询到的用户实例（如果存在），否则返回 null
     */
    async findByEmail(email) {
        return await User.findOne({
            where: {
                email,
            }
        });
    }
    /**
     * 根据用户ID查询用户
     * @param {number} userId - 用户ID
     * @returns {Promise<Object|null>} - 返回查询到的用户实例（如果存在），否则返回 null
     */
    async findById(userId) {
        return await User.findByPk(userId);
    }
    /**
     * 验证密码
     * @param {string} password - 密码
     * @param {string} hashedPassword - 哈希后的密码
     * @returns {boolean} - 返回密码是否匹配的布尔值
     */
    async verifyPassword(password, hashedPassword) {
        // 调用bcrypt的compareSync方法（同步验证），比对明文与加密密码
        return await bcrypt.compareSync(password, hashedPassword);
    }
    /**
     * 更新用户最后的登录时间
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @returns {Promise<Object>} - 用户资料
     */
    async updateLastLoginTime(userId) {
        return await User.update({
            lastLoginTime: new Date(),
        }, {
            where: {
                id: userId,
            }
        });
    }
    /**
     * 获取用户资料
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @returns {Promise<Object|null>} - 返回查询到的用户实例（如果存在），否则返回 null
     */
    async getUserProfile(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('用户不存在');
        }
        const state = await this.getUserStates(userId);
        return {
            id: user.id,
            username: user.username,
            fullName: user.fullName, // 使用Sequelize模型字段名
            email: user.email,
            avatar: user.avatar,
            bio: user.bio || '',
            role: user.role,
            status: user.status,
            joinDate: user.createdAt,
            lastLoginTime: user.lastLogin,
            stats,
        };
    }
    /**
     * 更新用户资料
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @param {Object} profileData - 更新的用户资料对象（包含需要更新的字段）
     * @returns {Promise<Object>} - 更新后的用户实例
     */
    async updateUserProfile(userId, profileData) {
        const { fullName, email, bio } = profileData;
        if (email && !this.isValidEmail(email)) {
            throw new Error('邮箱格式错误');
        }
        if (email) {
            const existingUser = await User.findOne({
                where: { email, id: { [Option.ne]: userId } },
            });
            if (existingUser) {
                throw new Error('该邮箱已被其他用户注册');
            }
        }
        // 准备更新数据 - 使用Sequelize模型字段名
        const updateData = {};
        if (fullName !== undefined && fullName !== null) {
            updateData.fullName = fullName;
        }
        if (bio !== undefined && bio !== null) {
            updateData.bio = bio;
        }
        if (email && email.trim()) {
            updateData.email = email;
        }
        // 更新用户表
        await User.update(updateData, { where: { id: userId } });
        return { message: '用户资料更新成功' };
    }
    /**
     * 修改用户密码
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @param {string} currentPassword - 当前密码
     * @param {string} newPassword - 新密码
     * @returns {Promise<Object>} - 返回修改密码成功的消息
     */
    async changePassword(userId, currentPassword, newPassword) {
        // 验证当前密码是否正确
        const user = await this.findByPk(userId);
        if (!user) {
            throw new Error('用户不存在');
        }
        const isPasswordValid = await this.verifyPassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('当前密码错误');
        }
        // 验证新密码是否与当前密码相同
        if (currentPassword === newPassword) {
            throw new Error('新密码不能与当前密码相同');
        }
        // 加密新密码
        const hashedPassword = await bcrypt.hashSync(newPassword, 12);
        // 更新用户密码
        await User.update({ password: hashedPassword }, { where: { id: userId } });
        return { message: '密码修改成功' };
    }

    /**
     * 更新用户头像
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @param {string} avatarUrl - 新的头像URL
     * @returns {Promise<void>} - 返回更新头像成功的消息
     */
    async updateUserAvatar(userId, avatarUrl) {
        // 更新用户表中的头像字段
        await User.update({ avatar: avatarUrl }, { where: { id: userId } });
        return { message: '头像更新成功' };
    }
    /**
     * 获取用户活动记录
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @param {Object} options 选项
     * @returns {Promise<Object>} - 返回用户的活动记录数组
     */
    async getActivity(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        const { count, rows } = await UserActivity.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']], // 按创建时间降序排序
            limit: limitNum,
            offset,
        });
        const activity = rows.map(activity => ({
            id: activity.id,
            userId: activity.userId,
            title: activity.title,
            description: activity.description,
            timeStamp: activity.timeStamp,
            link: activity.link,
            metadata: activity.metadata,
        }));
        return {
            data: activity,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPage: Math.ceil(count / limitNum),
            }
        }
    }
    /**
     * 获取用户成就
     * @param {string|number} userId - 用户ID（字符串或数字类型）
     * @returns {Promise<Array>} - 返回用户的成就数组
     */
    async getAchievements(userId) {
        const achievements = await UserAchievement.findAll({
            where: { userId },
            order: [
                ['unlockedAt', 'DESC'],
                ['unlocked', 'DESC'],
                ['createdAt', 'ASC'],
            ], // 按创建时间降序排序
        });

        // 如果用户没有成就记录， 初始化成就
        if (achievements.length === 0) {
            await this.initializeAchievements(userId);
            return await UserAchievement.findAll({
                where: { userId },
                order: [
                    ['unlockedAt', 'DESC'],
                    ['unlocked', 'DESC'],
                    ['createdAt', 'ASC'],
                ]
            })
        }
        return achievements;
    }

    /**
     * 初始化用户成就
     * @param {number} userId - 用户ID
     * @returns {Promise<void>} 
     */
    async initializeAchievements(userId) {
        try {
            const { Achievement } = require('../models');

            // 检查是否已经初始化过
            const existing = await UserAchievement.count({
                where: { userId },
            });
            if (existing > 0) {
                return;
            }
            // 获取所有活跃的成绩
            const achievements = await Achievement.findAll({
                where: { isActive: true },
            });
            if (achievements.length === 0) {
                console.warn(`用户${userId}没有活跃的成就`);
                return
            }
            // 为用户创建成就记录
            const userAchievements = achievements.map(achievement => ({
                userId,
                achievementId: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category,
                unlocked: false,
                unlockedAt: null,
                points: achievement.points,
                rarity: achievement.rarity,
                progress: {
                    current: 0,
                    target: achievement.criteria?.target || 1,
                },
            }));

            await UserAchievement.bulkCreate(userAchievements);
            console.log(`成功为用户 ${userId} 初始化 ${userAchievements.length} 个成就`);
        } catch (error) {
            console.error('初始化用户成就失败:', error);
            // throw error;
        }
    }
    /** 
     * 创建用户 （管理员）
     * @param {Object} userData - 用户数据
     * @returns {Promise<Object>} - 创建的用户
     */
    async createUser(userData) {
        const { username, password, email, role = 'user', status = 'active' } = userData;
        // 检查用户名是否存在
        const existingUsername = await this.findByUsername(username);
        if (existingUsername) {
            throw new Error('用户名已存在');
        }
        // 检查邮箱是否存在
        const existingEmail = await this.findByEmail(email);
        if (existingEmail) {
            throw new Error('邮箱已存在');
        }
        // 加密密码
        const hashedPassword = await bcrypt.hashSync(password, 12);
        // 创建用户
        const user = await User.create({
            username,
            password: hashedPassword,
            email,
            role,
            status,
        });
        // 返回用户信息（不包含密码）
        const { password: _, ...userInfo } = user.toJSON();
        return userInfo;
    }

}

// 创建服务实例
const userService = new UserService();
module.exports = userService;
