// const mysql = require('mysql2');
// require('dotenv').config();

// // Crear pool de conexiones (mejor rendimiento)

//  const pool = mysql.createPool({
//    host: process.env.DB_HOST,
//    user: process.env.DB_USER,
//    password: process.env.DB_PASSWORD,
//    database: process.env.DB_NAME,
//    waitForConnections: true,
//    connectionLimit: 10,
//    queueLimit: 0
//  });

// // const pool = mysql.createPool({
// //   host: '198.59.144.130', // Tu Shared IP de cPanel
// //   user: 'estet1caleos_proyecto', // El usuario que creaste en el Wizard
// //   password: 'sistemaleos12345!', 
// //   database: 'estet1caleos_estetica_db', // Nombre completo de la BD
// //   waitForConnections: true,
// //   connectionLimit: 10,
// //   queueLimit: 0
// // });

// // Usar promesas en lugar de callbacks
// const promisePool = pool.promise();

// // Verificar conexión
// pool.getConnection((err, connection) => {
//   if (err) {
//     console.error('❌ Error conectando a la BD:', err.message);
//   } else {
//     console.log('✅ Conexión exitosa a MySQL');
//     connection.release();
//   }
// });

// module.exports = promisePool;

// //module.exports = pool.promise();

const mysql = require('mysql2');

// Creamos un "pool" de conexiones (es mejor que una conexión simple para servidores externos)
const pool = mysql.createPool({
  host: process.env.DB_HOST,      // Ej: esteticaleo.com
  user: process.env.DB_USER,      // Ej: u12345_jesus
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,  // Ej: u12345_estetica_db
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertimos el pool para usar Promesas (async/await), es más moderno
const promisePool = pool.promise();

console.log(' Intentando conectar a la base de datos en cPanel...');

module.exports = promisePool;