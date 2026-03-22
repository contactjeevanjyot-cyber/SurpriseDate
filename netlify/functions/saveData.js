// netlify/functions/saveData.js
import { Client } from '@neondatabase/serverless';

export default async (request, context) => {
  try {
    const body = await request.json();
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();

    // Save this user to database
    const insertQuery = `
      INSERT INTO date_preferences
      (name, mobile, contact_choice, photo_url, date, time, message, interested_in, date_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id;
    `;
    const insertValues = [
      body.name,
      body.mobile,
      body.contactChoice,
      body.photoURL,
      body.date,
      body.time,
      body.message,
      body.interestedIn,
      body.dateType
    ];
    
    const insertResult = await client.query(insertQuery, insertValues);
    const newUserId = insertResult.rows[0].id;

    // Look for matches (same date + time, different user)
    const matchQuery = `
      SELECT * FROM date_preferences 
      WHERE date = $1 AND time = $2 AND id != $3
      ORDER BY created_at ASC
      LIMIT 1;
    `;
    const matchResult = await client.query(matchQuery, [body.date, body.time, newUserId]);

    await client.end();

    if (matchResult.rows.length > 0) {
      const match = matchResult.rows[0];
      
      console.log(`🎉 MATCH FOUND: ${body.name} (${body.mobile}) matched with ${match.name} (${match.mobile}) for ${body.date} at ${body.time}`);
      
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
      matched: false,
      message: 'Looking for matches...'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('SaveData Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
