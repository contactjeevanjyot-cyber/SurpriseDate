const { Client } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const client = new Client(process.env.DATABASE_URL);
    await client.connect();

    const insertQuery = `
      INSERT INTO date_preferences
      (name, mobile, contact_choice, photo_url, date, time, message, interested_in, date_type, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING id;
    `;

    const values = [
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

    const result = await client.query(insertQuery, values);
    const newUserId = result.rows[0].id;

    const matchQuery = `
      SELECT * FROM date_preferences
      WHERE date=$1 AND time=$2 AND id!=$3
      LIMIT 1;
    `;

    const match = await client.query(matchQuery, [body.date, body.time, newUserId]);

    await client.end();

    if (match.rows.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "success",
          matched: true,
          matchData: match.rows[0]
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        matched: false
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
