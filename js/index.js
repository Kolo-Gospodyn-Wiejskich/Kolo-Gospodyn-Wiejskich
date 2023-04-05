import { connect } from '@planetscale/database';

const config = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
};

const conn = connect(config);

async function updateLeaderboard() {
  const punktacja = {
    1: 3,
    2: 2,
    3: 1,
    4: 0,
    5: -1,
    6: -2,
    DNF: -2,
  };

  const query = `
    SELECT Miejsce, Imie
    FROM MiejscaKoncowe, Gospodynie
    WHERE MiejscaKoncowe.IdGospodyni = Gospodynie.IdGospodyni
  `;
  const result = await conn.execute(query);

  const punktyGospodyn = new Map();

  for (const row of result.rows) {
    const currentPoints = punktyGospodyn.get(row.Imie) ?? 0;
    punktyGospodyn.set(row.Imie, currentPoints + punktacja[row.Miejsce]);
  }

  const punktySorted = new Map(
    [...punktyGospodyn.entries()].sort((a, b) => b[1] - a[1])
  );

  const table = document.querySelector('#board');
  table.innerHTML = '';

  for (const [imie, punkty] of punktySorted) {
    const tableRow = document.createElement('tr');
    const imieEl = document.createElement('td');
    const punktyEl = document.createElement('td');

    imieEl.innerHTML = imie;
    punktyEl.innerHTML = punkty;

    tableRow.appendChild(imieEl);
    tableRow.appendChild(punktyEl);
    table.appendChild(tableRow);
  }
}

async function updateThemeAndGalleryPreview() {
  const query = `
    SELECT NazwaTematu
    FROM Konkurencje
    WHERE Data = (SELECT MAX(DATA) FROM Konkurencje)
  `;
  const result = await conn.execute(query);
  const themeName = result.rows[0].NazwaTematu;

  const motyw = document.querySelector('#motyw');
  motyw.innerHTML = themeName;

  const img = document.querySelector('#galeriaImg');
  img.src = `assets/${themeName.toLowerCase()}.jpg`;
}

updateThemeAndGalleryPreview();
updateLeaderboard();
