// netlify/functions/saveData.js
import { Client } from '@neondatabase/serverless';

export default async (request, context) => {
  try {
    const body = await request.json();
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();

    const query = `
      INSERT INTO date_preferences
      (name, contact_choice, photo_url, date, time, message)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    const values = [
      body.name,
      body.contactChoice,
      body.photoURL,
      body.date,
      body.time,
      body.message
    ];
    await client.query(query, values);
    await client.end();

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
