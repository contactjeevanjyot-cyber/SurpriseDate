// netlify/functions/saveData.js
import { Client } from '@neondatabase/serverless';

export default async (request, context) => {
  try {
    const body = await request.json();
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();

    // Save user
    const insertQuery = `
      INSERT INTO date_preferences
      (name, contact_choice, photo_url, date, time, message, interested_in, date_type, mobile, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id;
    `;
    const insertValues = [
      body.name, body.contactChoice, body.photoURL, 
      body.date, body.time, body.message, 
      body.interestedIn, body.dateType, body.mobile
    ];
    
    const insertResult = await client.query(insertQuery, insertValues);
    const newUserId = insertResult.rows[0].id;

    // Check for matches
    const matchQuery = `
      SELECT * FROM date_preferences 
      WHERE date = $1 AND time = $2 AND id != $3
      LIMIT 1;
    `;
    const matchResult = await client.query(matchQuery, [body.date, body.time, newUserId]);

    await client.end();

    if (matchResult.rows.length > 0) {
      const match = matchResult.rows[0];
      return new Response(JSON.stringify({ 
        status: 'success', 
        matched: true,
        matchData: {
          name: match.name,
          mobile: match.mobile,
          userMobile: body.mobile
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      status: 'success', 
      matched: false 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
