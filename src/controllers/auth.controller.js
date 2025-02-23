const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username },
      include: [{ model: Role }]
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.Role.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await user.update({ lastLogin: new Date() });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.Role.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
};

module.exports = { login };