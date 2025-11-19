const db = require('../models');
const Post = db.Post;
const User = db.User;
const Tag = db.Tag;
const Categroup = db.Categroup;
const PostLike = db.PostLike;
const PostBookmark = db.PostBookmark;
const { Op } = require('sequelize');
/**
 * 获取公开文章列表（前台展示）
 * 返回所有已发布且审核通过的文章
 */

const {asyncHandler} = require("../utils/response");
exports.getAllPosts = asyncHandler(async (req, res) => {
    let {page=1, limit=10, search, tagId, categoryId, tag, year} = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // const where = {};
    // // 前台只显示已发布并审核通过的文章
    // where.status = 1;
    // where.auditStatus = 1;
    // 搜索功能
    // if (search) {
    //     where[Op.or] = [
    //         { title: { [Op.like]: `%${search}%` } },
    //         { content: { [Op.like]: `%${search}%` } },
    //     ];
    // }

    // 标签过滤（支持两种参数名）
    // const tagFilter = tagId || tag;
    // let tagInclude = null;
    // if (tagFilter) {
    //     if (isNaN(tagFilter)) {
    //         // 如果是标签名，通过关联查询
    //         tagInclude = {
    //             model: Tag,
    //             as: 'tags',
    //             where: { name: { [Op.like]: `%${tagFilter}%` } },
    //             through: { attributes: [] },
    //             attributes: ['id', 'name', 'description'],
    //         };
    //     } else {
    //         // 如果是标签ID
    //         tagInclude = {
    //             model: Tag,
    //             as: 'tags',
    //             where: { id: parseInt(tagFilter) },
    //             through: { attributes: [] },
    //             attributes: ['id', 'name', 'description'],
    //         };
    //     }
    // }
    //
    // // 分类过滤
    // if (categoryId) {
    //     where.typeId = parseInt(categoryId);
    // }
    //
    // // 按年份筛选
    // if (year) {
    //     const yearInt = parseInt(year);
    //     const startDate = new Date(yearInt, 0, 1); // 1月1日
    //     const endDate = new Date(yearInt + 1, 0, 1); // 下一年1月1日
    //     where.publishedAt = {
    //         [Op.gte]: startDate,
    //         [Op.lt]: endDate,
    //     };
    // }
    //
    // // 完整的关联查询：作者、分类、标签
    // const include = [
    //     {
    //         model: User,
    //         as: 'author',
    //         attributes: ['id', 'username', 'email', 'fullName', 'avatar'],
    //     },
    //     {
    //         model: Categroup,
    //         as: 'category',
    //         attributes: ['id', 'name', 'description'],
    //     },
    //     // 如果有标签筛选，使用带条件的 include，否则使用普通 include
    //     tagInclude || {
    //         model: Tag,
    //         as: 'tags',
    //         through: { attributes: [] },
    //         attributes: ['id', 'name', 'description'],
    //     },
    // ];
    const { count, rows } = await Post.findAndCountAll({
        // where,
        // include,
        // order: [
        //     ['publishedAt', 'DESC'],
        //     ['createdAt', 'DESC'],
        // ],
        limit,
        offset: (page - 1) * limit,
        // distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };

    return res.apiPaginated(rows, pagination, '获取文章列表成功');

})