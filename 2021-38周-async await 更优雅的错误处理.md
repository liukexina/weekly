# async await 更优雅的错误处理

## 背景
ES7 Async/await 允许我们作为开发人员编写看起来同步的异步 JS 代码。在当前的 JS 版本中，我们引入了 Promises，这使我们能够简化异步流程并避免回调地狱。

```js
function AsyncTask() {
   asyncFuncA(function(err, resultA){
      if(err) return cb(err);

      asyncFuncB(function(err, resultB){
         if(err) return cb(err);

          asyncFuncC(function(err, resultC){
               if(err) return cb(err);

               // And so it goes....
          });
      });
   });
}
```

这使得维护代码和管理控制流变得非常困难。想想如果 callbackA 的某些结果等于 'foo' 时需要执行其他异步方法的 if 语句。

### Promise

有了 promises 和 ES6，我们可以将之前的代码噩梦简化成这样：
```js
function asyncTask(cb) {

   asyncFuncA.then(AsyncFuncB)
      .then(AsyncFuncC)
      .then(AsyncFuncD)
      .then(data => cb(null, data)
      .catch(err => cb(err));
}
```
但在现实世界的场景中，异步流可能会变得更复杂一些，例如在您的服务器模型 (nodejs) 中，您可能希望将一个实体保存到数据库中，然后根据保存的值查找其他实体（如果该值存在） ，执行一些其他异步任务，在所有任务完成后，您可能希望使用步骤 1 中创建的对象来响应用户。如果在其中一个步骤中发生错误，您希望将确切的错误告知用户。

### ES7 异步/等待
```js
async function asyncTask(cb) {
    const user = await UserModel.findById(1);
    if(!user) return cb('No user found');

    const savedTask = await TaskModel({userId: user.id, name: 'Demo Task'});
    
    if(user.notificationsEnabled) {
         await NotificationService.sendNotification(user.id, 'Task Created');  
    }

    if(savedTask.assignedUser.id !== user.id) {
        await NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you');
    }

    cb(null, savedTask);
}
```

但是，错误处理呢？

在进行异步调用时，可能会在 promise 的执行过程中发生一些事情（数据库连接错误、数据库模型验证错误等。）

由于异步函数正在等待 Promise，当 Promise 遇到错误时，它会抛出一个异常，该异常将在 Promise 的 catch 方法中捕获。

在 async/await 函数中，通常使用try/catch块来捕获此类错误。

```js
async function asyncTask(cb) {
    try {
       const user = await UserModel.findById(1);
       if(!user) return cb('No user found');
    } catch(e) {
        return cb('Unexpected error occurred');
    }

    try {
       const savedTask = await TaskModel({userId: user.id, name: 'Demo Task'});
    } catch(e) {
        return cb('Error occurred while saving task');
    }

    if(user.notificationsEnabled) {
        try {
            await NotificationService.sendNotification(user.id, 'Task Created');  
        } catch(e) {
            return cb('Error while sending notification');
        }
    }

    if(savedTask.assignedUser.id !== user.id) {
        try {
            await NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you');
        } catch(e) {
            return cb('Error while sending notification');
        }
    }

    cb(null, savedTask);
}
```

## async await 更优雅的错误处理

加 try...catch 并不是一个很优雅的行为。

一种更优雅的方法处理，并封装成了一个库——[await-to-js](https://github.com/scopsy/await-to-js)。这个库只有一个 function，我们完全可以将这个函数运用到我们的业务中，
```js
/**
 * @param { Promise } promise
 * @param { Object= } errorExt - Additional Information you can pass to the err object
 * @return { Promise }
 */
export function to<T, U = Error> (
  promise: Promise<T>,
  errorExt?: object
): Promise<[U, undefined] | [null, T]> {
  return promise
    .then<[null, T]>((data: T) => [null, data]) // 执行成功，返回数组第一项为 null。第二个是结果。
    .catch<[U, undefined]>((err: U) => {
      if (errorExt) {
        Object.assign(err, errorExt);
      }

      return [err, undefined]; // 执行失败，返回数组第一项为错误信息，第二项为 undefined
    });
}

export default to;
```

一个前置的知识点：await 是在等待一个 Promise 的返回值。

正常情况下，await 命令后面是一个 Promise 对象，返回该对象的结果。如果不是 Promise 对象，就直接返回对应的值。
所以我们只需要利用 Promise 的特性，分别在 promise.then 和 promise.catch 中返回不同的数组，其中 fulfilled 的时候返回数组第一项为 null，第二个是结果。rejected 的时候，返回数组第一项为错误信息，第二项为 undefined。使用的时候，判断第一项是否为空，即可知道是否有错误，具体使用如下：
```js
import to from 'await-to-js';
// If you use CommonJS (i.e NodeJS environment), it should be:
// const to = require('await-to-js').default;

async function asyncTaskWithCb(cb) {
     let err, user, savedTask, notification;

     [ err, user ] = await to(UserModel.findById(1));
     if(!user) return cb('No user found');

     [ err, savedTask ] = await to(TaskModel({userId: user.id, name: 'Demo Task'}));
     if(err) return cb('Error occurred while saving task');

    if(user.notificationsEnabled) {
       [ err ] = await to(NotificationService.sendNotification(user.id, 'Task Created'));
       if(err) return cb('Error while sending notification');
    }

    if(savedTask.assignedUser.id !== user.id) {
       [ err, notification ] = await to(NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you'));
       if(err) return cb('Error while sending notification');
    }

    cb(null, savedTask);
}
```

## 总结
async await 中添加错误处理个人认为是有必要的，但方案不仅仅只有 try...catch。利用 async await 和 Promise 的特性，我们可以更加优雅的处理 async await 的错误。
