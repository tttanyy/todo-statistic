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
        case 'sort':
            if (args.length === 1 && ['importance', 'user', 'date'].includes(args[0])) {
                sortTodos(args[0]);
            } else {
                console.log('Usage: sort {importance | user | date}');
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

function sortTodos(sortType) {
    const todos = getTodos();

    if (todos.length === 0) {
        console.log('No TODO comments found.');
        return;
    }

    switch (sortType) {
        case 'importance':
            sortImportance(todos);
            break;
        case 'user':
            sortUser(todos);
            break;
        case 'date':
            sortDate(todos);
            break;
        default:
            console.log('invalid sort type');
            break;
    }
}

function sortImportance(todos) {
    const importantTodos = todos.filter(todo => todo.includes('!'));

    if (importantTodos.length === 0) {
        console.log('No important TODO comments found.');
        return;
    }

    importantTodos.sort((a, b) => {
        const countA = (a.match(/!/g) || []).length;
        const countB = (b.match(/!/g) || []).length;
        return countB - countA; 
    });

    console.log('TODO comments sorted by importance:');
    importantTodos.forEach(todo => console.log(todo));
}

function sortUser(todos) {
    const userMap = new Map();
    const noUserTodos = [];

    todos.forEach(todo => {
        const match = todo.match(/\/\/ TODO\s*({[^;]+}|[^;]+?);/);
        if (match) {
            let username = match[1].trim();
            if (username.startsWith('{') && username.endsWith('}')) {
                username = username.slice(1, -1).trim(); 
            }
            const normalizedUsername = username.toLowerCase(); 

            if (!userMap.has(normalizedUsername)) {
                userMap.set(normalizedUsername, []);
            }
            userMap.get(normalizedUsername).push(todo);
        } else {
            noUserTodos.push(todo);
        }
    });

    console.log('TODO comments sorted by user:');

    Array.from(userMap.keys())
        .sort()
        .forEach(username => {
            console.log(`User: ${username}`);
            userMap.get(username).forEach(todo => console.log(todo));
        });

    if (noUserTodos.length > 0) {
        console.log('User: Unknown');
        noUserTodos.forEach(todo => console.log(todo));
    }
}

function sortDate(todos) {
    todos.sort((a, b) => {
        const dateA = extractDate(a);
        const dateB = extractDate(b);

        if (dateA && dateB) {
            return dateB.localeCompare(dateA); 
        } else if (dateA) {
            return -1; 
        } else if (dateB) {
            return 1; 
        } else {
            return 0; 
        }
    });

    console.log('TODO comments sorted by date:');
    todos.forEach(todo => console.log(todo));
}

function extractDate(todo) {
    const match = todo.match(/;\s*(\d{4}-\d{2}-\d{2})\s*;/);
    return match ? match[1] : null;
}