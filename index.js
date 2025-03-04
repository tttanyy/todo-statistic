const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => ({
        path: path,
        content: readFile(path)
    }));
}

function processCommand(command) {
    switch (command.trim()) {
        case 'exit':
            process.exit(0);
            break;
        case 'get-todos': 
            console.log(getTodos());
            break;
        case 'show': 
            showTodos();
            break;
        case 'important': 
            showImportantTodos();
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function getTodos() {
    const todos = files.flatMap(file => {
        const matches = file.content.match(/\/\/ TODO .*/g) || [];
        return matches.map(match => `${file.path}: ${match}`);
    });
    return todos;
}

function showTodos() {
    const todos = getTodos();

    if (todos.length > 0) {
        console.log('TODO comments:');
        todos.forEach(todo => console.log(todo)); 
    } else {
        console.log('No TODO comments found');
    }
}

function showImportantTodos() {
    const todos = getTodos(); 
    const importantTodos = todos.filter(todo => todo.includes('!')); 

    if (importantTodos.length > 0) {
        console.log('important TODO comments:');
        importantTodos.forEach(todo => console.log(todo));
    } else {
        console.log('No important TODO comments found');
    }
}