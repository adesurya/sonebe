// src/controllers/user.controller.js
const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const logger = require('../utils/logger');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Role,
        attributes: ['name', 'description']
      }],
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Role,
        attributes: ['name', 'description']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, roleId, regionId } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username or email already exists'
      });
    }

    // Validate role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.create({
      username,
      email,
      password, // Will be hashed by model hook
      roleId,
      regionId,
      isActive: true
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, roleId, regionId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check username/email uniqueness if they're being updated
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          [User.sequelize.Op.and]: [
            { id: { [User.sequelize.Op.ne]: id } },
            {
              [User.sequelize.Op.or]: [
                username ? { username } : null,
                email ? { email } : null
              ].filter(Boolean)
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Username or email already exists'
        });
      }
    }

    // If roleId is provided, validate it exists
    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({ message: 'Invalid role' });
      }
    }

    // Update user
    await user.update({
      username: username || user.username,
      email: email || user.email,
      password: password || user.password, // Will be hashed by model hook if changed
      roleId: roleId || user.roleId,
      regionId: regionId || user.regionId,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    // Fetch updated user with role information
    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Role,
        attributes: ['name', 'description']
      }],
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin user
    if (user.roleId === 1) { // Assuming 1 is admin role ID
      const adminCount = await User.count({
        where: { roleId: 1 }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    await user.update({ password: newPassword });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
};