import pg from 'pg';
import {migrate} from '../server/storage.js';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required; run npm run db:configure first.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
try{await client.connect();await migrate(client);console.log('PostgreSQL migrations applied.');}finally{await client.end();}
