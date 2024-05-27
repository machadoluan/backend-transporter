const mysql = require('mysql2');
require('dotenv').config()

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'email'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
});

module.exports = connection;
