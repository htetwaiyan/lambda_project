import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

export const createTodo = async (event) => {
    const { title } = JSON.parse(event.body);
    if (!title) {
        return { statusCode: 400, body: JSON.stringify({ message: "Title is required" }) };
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute("INSERT INTO todos (title) VALUES (?)", [title]);
        return {
            statusCode: 201,
            body: JSON.stringify({ id: result.insertId, title })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    } finally {
        await connection.end();
    }
};
