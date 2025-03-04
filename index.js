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
        case 'date':
            if (args.length === 1) {
                showTodosAfterDate(args[0]);
            } else {
                console.log('Usage: date {yyyy[-mm[-dd]]}');
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
        return matches.map(match => ({
            path: file.path,
            comment: match
        }));
    });
    return todos;
}

function showTodos() {
    const todos = getTodos();
    formatTodoTable(todos, 'List of TODO comments:');
}

function showImportantTodos() {
    const todos = getTodos();
    const importantTodos = todos.filter(todo => todo.comment.includes('!'));
    formatTodoTable(importantTodos, 'List of important TODO comments:');
}

function showUserTodos(username) {
    const todos = getTodos();
    const userTodos = todos.filter(todo => {
        const match = todo.comment.match(/\/\/ TODO\s*({[^;]+}|[^;]+?);/);
        if (match) {
            let extractedUsername = match[1].trim();
            if (extractedUsername.startsWith('{') && extractedUsername.endsWith('}')) {
                extractedUsername = extractedUsername.slice(1, -1).trim();
            }
            return extractedUsername.toLowerCase() === username;
        }
        return false;
    });

    formatTodoTable(userTodos, `List of TODO comments by user "${username}":`);
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
    const importantTodos = todos.filter(todo => todo.comment.includes('!'));

    if (importantTodos.length === 0) {
        console.log('No important TODO comments found.');
        return;
    }

    importantTodos.sort((a, b) => {
        const countA = (a.comment.match(/!/g) || []).length;
        const countB = (b.comment.match(/!/g) || []).length;
        return countB - countA;
    });

    formatTodoTable(importantTodos, 'TODO comments sorted by importance:');
}

function sortUser(todos) {
    const userMap = new Map();
    const noUserTodos = [];

    todos.forEach(todo => {
        const match = todo.comment.match(/\/\/ TODO\s*({[^;]+}|[^;]+?);/);
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

    const sortedTodos = Array.from(userMap.keys())
        .sort()
        .flatMap(username => userMap.get(username));

    sortedTodos.push(...noUserTodos);

    formatTodoTable(sortedTodos, 'TODO comments sorted by user:');
}

function sortDate(todos) {
    todos.sort((a, b) => {
        const dateA = extractDate(a.comment);
        const dateB = extractDate(b.comment);

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

    formatTodoTable(todos, 'TODO comments sorted by date:');
}

function showTodosAfterDate(dateStr) {
    const todos = getTodos();
    const targetDate = parseDate(dateStr);

    if (!targetDate) {
        console.log('Invalid date format. Use yyyy, yyyy-mm, or yyyy-mm-dd.');
        return;
    }

    const filteredTodos = todos.filter(todo => {
        const todoDate = extractDate(todo.comment);
        if (!todoDate) return false;
        return isAfterDate(todoDate, targetDate);
    });

    formatTodoTable(filteredTodos, `TODO comments created after ${dateStr}:`);
}

function parseDate(dateStr) {
    const parts = dateStr.split('-').map(part => parseInt(part, 10));
    if (parts.length === 1) {
        return new Date(parts[0], 0, 1);
    } else if (parts.length === 2) {
        return new Date(parts[0], parts[1] - 1, 1);
    } else if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
}

function extractDate(comment) {
    const match = comment.match(/;\s*(\d{4}-\d{2}-\d{2})\s*;/);
    return match ? match[1] : null;
}

function isAfterDate(todoDate, targetDate) {
    return new Date(todoDate) >= targetDate;
}

function formatTodoTable(todos, title) {
    if (todos.length === 0) {
        console.log(title);
        console.log('No TODO comments found.');
        return;
    }

    console.log(title);

    const table = todos.map(todo => {
        const importance = todo.comment.includes('!') ? '!' : ' ';
        const userMatch = todo.comment.match(/\/\/ TODO\s*({[^;]+}|[^;]+?);/);
        const user = userMatch ? userMatch[1].trim() : ' ';
        const dateMatch = todo.comment.match(/;\s*(\d{4}-\d{2}-\d{2})\s*;/);
        const date = dateMatch ? dateMatch[1] : ' ';
        const comment = todo.comment.replace(/\/\/ TODO\s*({[^;]+}|[^;]+?);\s*(\d{4}-\d{2}-\d{2})?\s*;/, '').trim();

        return {
            importance: importance,
            user: user,
            date: date,
            comment: comment
        };
    });

    const formattedTable = table.map(row => {
        const importance = row.importance.padEnd(3, ' ');
        const user = row.user.slice(0, 10).padEnd(12, ' ');
        const date = row.date.slice(0, 10).padEnd(12, ' ');
        const comment = row.comment.slice(0, 50).padEnd(52, ' ');

        return `${importance} |  ${user} |  ${date} |  ${comment}`;
    });

    console.log(formattedTable.join('\n'));
}