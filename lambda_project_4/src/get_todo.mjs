import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

export const getTodo = async () => {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute("SELECT * FROM todos ORDER BY created_at DESC");
        return { statusCode: 200, body: JSON.stringify(rows) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    } finally {
        await connection.end();
    }
};
