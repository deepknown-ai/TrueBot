const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    compress: false,
    proxy: {
      
        // 匹配以 /maas 开头的请求
        '/maas': {
            // 后端接口的基础地址，替换成你的实际后端地址
            target: 'http://127.0.0.1:8088',
            changeOrigin: true,
            pathRewrite: {
                // 可以在这里重写路径，这里保持原样
                '^/maas': '/maas'
            }
        }
    }
  }

})
