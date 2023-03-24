import { connect } from '@planetscale/database';

async function updateLeaderboard() {
  const config = {
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  };

  const conn = connect(config);
  const MiejscaKoncowe = await conn.execute('SELECT * FROM MiejscaKoncowe');
  const Gospodynie = await conn.execute('SELECT * FROM Gospodynie');
  console.log(MiejscaKoncowe);
  console.log(Gospodynie);
  //const table = document.querySelector('#board');
}

updateLeaderboard();
