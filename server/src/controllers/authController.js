import bcrypt from 'bcrypt';
import pool from '../db/index.js';

export const loginController = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // 1. Buscar al usuario en la tabla 'usuarios' de Postgres
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const usuarioDb = result.rows[0];

    if (!usuarioDb?.password) {
      console.error('loginController: contraseña no encontrada para usuario', usuarioDb);
      return res.status(500).json({ message: 'Error interno del servidor al autenticar' });
    }

    // 2. Verificar la contraseña ingresada contra el Hash guardado en Postgres
    const passwordCorrecta = await bcrypt.compare(password, usuarioDb.password);

    if (!passwordCorrecta) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // 3. Devolver los datos exactos que tu AuthContext de React espera recibir
    return res.status(200).json({
      user: {
        id: usuarioDb.id,
        username: usuarioDb.username,
        nombre: usuarioDb.nombre,
        rol: usuarioDb.role || usuarioDb.rol // Se adapta a cómo llamaras tu columna
      }
    });

  } catch (error) {
    console.error('Error en loginController:', error?.message || error, error);
    return res.status(500).json({ message: 'Error interno del servidor al autenticar' });
  }
};