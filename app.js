// 导入express
const express = require('express')

// 创建Express应用实例
const app = express();

// 定义端口
const PORT = process.env.PORT || 3001;

// 设置基本路由
app.get('/', (req, res) => {
    res.send("blog system")
})

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
})
