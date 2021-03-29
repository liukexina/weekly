# webpack的热重载和热更新

## 引言
在前端应用框架中不管是react还是vue，官方都提供了相应的脚手架方便开发者快速入手，当我们在开发时修改某个js或者css文件时，webpack会自动编译我们的文件，我们刷新浏览器就可以看到编译后的文件。为此我们会想，如果我们修改保存之后，文件被编译、浏览器自动刷新、或者浏览器局部刷新(不刷新整个浏览器)，这样的话多好。当然，基于webpack打包工具的相关库已经实现了。

## 热重载和热更新

热重载live reload： 就是当修改文件之后，webpack自动编译，然后浏览器自动刷新->等价于页面window.location.reload() 

热更新HMR： 热重载live reload并不能够保存应用的状态（states），当刷新页面后，应用之前状态丢失。

举个列子：页面中点击按钮出现弹窗，当浏览器刷新后，弹窗也随即消失，要恢复到之前状态，还需再次点击按钮。而webapck热更新HMR则不会刷新浏览器，而是运行时对模块进行热替换，保证了应用状态不会丢失，提升了开发效率


下面介绍一下配置和三者优劣：

## live reload

这其实就是上面说的热重载（live reload) 的实现方式了，有点简单粗暴，但是比完全需要手动刷新要好点吧。

###  配置方式

1. 安装依赖
```js
npm install --save-dev webpack-livereload-plugin
```
2. 在 webpack.config.js 中添加 plugin 配置
```js
// webpack.config.js

var LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  plugins: [
    new LiveReloadPlugin({
      port: "12345" // 配置 live-reload 的端口号，默认35729
    })
  ]
}
```

3. 在页面文件中加入 live-reload 生成的 js 文件，如果使用了 HtmlWebpackPlguin，可以直接在模板中加入这行。
```js
// 端口号为上面配置的
<script src="http://localhost:12345/livereload.js"></script>
```

### 总结
这种方式有一定的代码侵入性，而且因为是热重载（live reload) 的方式，所以开发体验欠佳

## react-hot-loader
这种方式使用的是热更新（HMR)，会检测你的改动点并局部刷新，而且支持 React Hooks。比上面热重载的体验会好一点。

### 配置

1. 安装依赖
```js
npm install --save-dev react-hot-loader
npm install --save-dev @hot-loader/react-dom // 如果要支持 React Hooks 需要安装这个
```
2. 设置webpack
```js
// webpack.config.js
module.exports = {
  // 1. 在入口添加 react-hot-loader/patch, 保证 react-hot-loader 在 react 和 react-dom 之前加载
  entry: ['react-hot-loader/patch', './src'],
  ...
  // 2. 设置 ts/tsx 的编译方式，使用 babel-loader 时在 options 中添加 plugins
   {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: [
              [
                "@babel/preset-env",
              ],
              "@babel/preset-typescript",
              "@babel/preset-react",
            ],
            plugins: [
              // plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
              ["@babel/plugin-proposal-decorators", { legacy: true }],
              ["@babel/plugin-proposal-class-properties", { loose: true }],
              "react-hot-loader/babel", // 添加 react-hot-loader 插件
            ],
          },
        },
   }
   // ... other configuration options
   resolve: {
    // 3. 设置 @hot-loader/react-dom，支持 React Hooks
    alias: {
      "react-dom": "@hot-loader/react-dom",
    },
  },
};
```
3. 入口组件使用 hot 包裹
```js
// App.js
import { hot } from 'react-hot-loader/root';
const App = () => <div>Hello World!</div>;
export default hot(App);
```

### 总结
这种方式虽然实现了我们的终极目标热更新（HMR），但是代码侵入性较大，需要包使用 hot 包裹入口组件，当是 multiple entries 的场景，就需要改动较多的业务代码。其次，如果使用 ts-loader（没有使用 babel-loader） 去编译 ts 文件的话，使用 react-hot-loader 会不成功，因为 react-hot-loader 依赖于 babel-loader，所以对于使用 ts-loader 的项目来说其实不太友好。

## Fast ReFresh

使用的是 React Refresh Webpack Plugin，该插件是 React 官方提供的，将热重载（live reload) 和 HMR 进行了整合，而且相比于 react-hot-loader，容错能力更高。

## 配置方式

1. 安装依赖
```js
npm install -D @pmmmwh/react-refresh-webpack-plugin react-refresh
```

2. 修改 webpack 配置
```js
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require('webpack');
// ... your other imports

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  module: {
    rules: [
      // ... other rules
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          // ... other loaders
          {
            loader: require.resolve('babel-loader'),
            options: {
              // ... other options
              plugins: [
                // ... other plugins
                isDevelopment && require.resolve('react-refresh/babel'),
              ].filter(Boolean),
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // ... other plugins
    isDevelopment && new webpack.HotModuleReplacementPlugin(),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  // ... other configuration options
};
```

从配置可以看出，只需要改动 webpack 相关配置即可，对业务代码没有侵入性。为什么说它是将热重载（live reload) 和 HMR 进行了整合，主要是它在处理 HMR 时分为了三种情况：

* 如果所编辑的模块仅导出了 React 组件，Fast Refresh 就只更新该模块的代码，并重新渲染对应的组件。此时该文件的所有修改都能生效，包括样式、渲染逻辑、事件处理、甚至一些副作用
* 如果所编辑的模块导出的东西不只是 React 组件，Fast Refresh 将重新执行该模块以及所有依赖它的模块
* 如果所编辑的文件被 React（组件）树之外的模块引用了，Fast Refresh 会降级成整个刷新（Live Reloading）

## 总结
三种方式对比如下：

1. 体验: fast refresh = react-hot-reload > live reload
2. 侵入性: react-hot-reload > live reload > fast refresh
3. 配置难度: live reload = fast refresh > react-hot-reload

由上表可以得出，fast refresh 无疑是最优选择。而且 fast refresh 被视为 react-hot-loader 下一代的解决方案，除此之外它还与平台无关，既支持 React Native，也支持 Web，所以最终选择了它。不过它也有一些局限性，比如当设置了 externals，HMR 会失效，所以开发环境可先关闭 externals 配置。


## 参考链接
[webpack-livereload-plugin](https://www.yuque.com/sunshinewyf/study-blog/webpack-livereload-plugin)

[react-hot-loader](https://github.com/gaearon/react-hot-loader)

[React Refresh Webpack Plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)

