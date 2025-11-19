const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const postController = require('../controllers/post.controller');

/**
 * @swagger
 * tags:
 *   name: 文章
 *   description: 文章管理相关接口
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 获取公开文章列表（前台展示）
 *     description: 返回所有已发布且审核通过的文章
 *     tags: [文章]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: 标签筛选
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 分类筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
 */
router.get('/', postController.getAllPosts);

router.patch(
    '/:id/audit',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    // postController.auditPost
);

module.exports = router;
