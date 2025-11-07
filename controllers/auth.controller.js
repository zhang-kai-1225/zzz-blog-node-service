const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/response');

/** 
 * 用户登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Function} next - 下一个中间件
 */

exports.login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    // 验证请求数据
    if (!username || !password) {
        return res.apiValidationError([
            {
                field: 'username',
                message: '用户名不能为空',
            },
            {
                field: 'password',
                message: '密码不能为空',
            },
        ], '用户名和密码不能为空');
    }
    // 调用登录服务
    const result = await authService.login(username, password);
    // 返回登录结果
    return res.apiSuccess(result, '登录成功');
})