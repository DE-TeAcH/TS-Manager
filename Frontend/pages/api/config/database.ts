import mysql from 'mysql2/promise';

class Database {
    private conn: mysql.Pool | null = null;

    public getConnection() {
        if (!this.conn) {
            try {
                this.conn = mysql.createPool({
                    host: 'localhost', // explicit localhost for windows/xampp
                    user: 'root',
                    password: '',
                    database: 'ts_manager',
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0
                });
            } catch (err) {
                console.error("DB Connection Failed:", err);
            }
        }
        return this.conn;
    }
}

export default new Database();
