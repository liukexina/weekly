// type Record = {
//   do: Function,
//   undo: Function
// }

class CommandManager {
  constructor() {
    this.undoStack = []
    this.redoStach = []
  }
  // 添加
  execute(payload) {
    this.undoStack.push(payload)
    payload.do()

    this.redoStack = []
  }
  // 撤销
  undo() {
    const record = this.undoStack.pop()
    record.undo()
    this.redoStack.push(record)
  }

  // 回退
  redo() {
    const record = this.redoStack.pop()
    record.do()
    this.undoStack.push(record)
  }
}

const commandManager = new CommandManager()
const member = 'z'
const group = ['a', 'b', 'c']
const addAction = {
  target: null,
  type: 'add',
  // 本次动作的正向操作方法
  do: () => {
    group.push(member)
  },
  // 逆操作方法
  undo: () => {
    const index = group.indexOf(member)
    if (index !== -1) {
      group.splice(index, 1)
    }
  }
}

// 提交给命令执行器去执行
commandManager.execute(addAction)
console.log(group)
// group: ['a', 'b', 'c', 'z']

commandManager.undo()
console.log(group)
// group: ['a', 'b', 'c']

commandManager.redo()
console.log(group)
// group: ['a', 'b', 'c', 'z']