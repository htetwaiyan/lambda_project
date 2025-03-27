import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

export const deleteTodo = async (event) => {
    const id = event.queryStringParameters?.id;
    if (!id) {
        return { statusCode: 400, body: JSON.stringify({ message: "ID is required" }) };
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute("DELETE FROM todos WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: "To-Do not found" }) };
        }
        return { statusCode: 200, body: JSON.stringify({ message: "To-Do deleted successfully" }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    } finally {
        await connection.end();
    }
};
