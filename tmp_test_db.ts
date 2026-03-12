import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
}

console.log("Testing connection to:", connectionString.split('@')[1]); // Log host part only for safety

const pool = new Pool({
    connectionString,
    ssl: true
});

async function test() {
    try {
        const client = await pool.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Query result:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await pool.end();
    }
}

test();
