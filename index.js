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
    const [cmd, ...args] = command.trim().split(' ');

    switch (cmd) {
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
        case 'user':
            if (args.length === 1) {
                showUserTodos(args[0].toLowerCase()); 
            } else {
                console.log('Usage: user {username}');
            }
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
        console.log('List of TODO comments:');
        todos.forEach(todo => console.log(todo));
    } else {
        console.log('No TODO comments found.');
    }
}

function showImportantTodos() {
    const todos = getTodos();
    const importantTodos = todos.filter(todo => todo.includes('!'));

    if (importantTodos.length > 0) {
        console.log('List of important TODO comments:');
        importantTodos.forEach(todo => console.log(todo));
    } else {
        console.log('No important TODO comments found.');
    }
}

function showUserTodos(username) {
    const todos = getTodos();
    const userTodos = todos.filter(todo => {
        const match = todo.match(/\/\/ TODO\s*({[^;]+}|[^;]+?);/);
        if (match) {
            let extractedUsername = match[1].trim();
            if (extractedUsername.startsWith('{') && extractedUsername.endsWith('}')) {
                extractedUsername = extractedUsername.slice(1, -1).trim();
            }
            return extractedUsername.toLowerCase() === username; 
        }
        return false;
    });

    if (userTodos.length > 0) {
        console.log(`List of TODO comments by user "${username}":`);
        userTodos.forEach(todo => console.log(todo));
    } else {
        console.log(`No TODO comments found for user "${username}".`);
    }
}