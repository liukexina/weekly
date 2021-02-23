# weekly
issue and share weekly

## issue

例如：
new操作符都做了什么?

```

function new(func) {
	let target = {};
	target.__proto__ = func.prototype;
	let res = func.call(target);
    // null 也是 object
	if (typeof(res) == "object" || typeof(res) == "function" || res !== null) {
		return res;
	}
	return target;
}

```

四大步骤：

1. 创建一个空对象，并且 this 变量引用该对象，// let target = {};
2. 继承了函数的`原型`。// target.proto = func.prototype;
3. `属性和方法`被加入到 this 引用的对象中。并执行了该函数func// func.call(target);
4. 新创建的对象由 this 所引用，并且最后隐式的`返回 this` 。// 如果func.call(target)返回的res是个对象或者function 就返回它



例子：

```
新一代打包

vite 与 snowpack


我们完全可以抛弃打包工具，而直接在浏览器中使用浏览器原生的 JavaScript 模块功能。这主要基于以下考虑：
1. 兼容性可接受：基本主流的浏览器版本都支持直接使用 JavaScript Module 了（当然，IE 一如既往除外）。
2. 性能问题的改善：之前打包的一个重要原因是 HTTP/1.1 的特性导致，我们合并请求来优化性能；  
而如今 HTTP/2 普及之后，这个性能问题不像以前那么突出了。

`webpack`要亡了吗？

```

坚持，日积月累。
