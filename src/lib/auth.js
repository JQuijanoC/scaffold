import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

export const authorize = (req, res, requiredCapability) => {
  return new Promise((resolve, reject) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Authorization header missing' });
      return reject(new Error('Authorization header missing'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Token missing' });
      return reject(new Error('Token missing'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ message: 'Invalid token' });
      return reject(new Error('Invalid token'));
    }

    if (requiredCapability && !decoded.capabilities?.includes(requiredCapability)) {
      res.status(403).json({ message: 'Forbidden' });
      return reject(new Error('Forbidden'));
    }

    req.user = decoded;
    resolve();
  });
};