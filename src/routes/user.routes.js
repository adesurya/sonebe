// src/routes/user.routes.js
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', 
  verifyToken, 
  authorize('admin_pusat'), 
  userController.getUsers
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id',
  verifyToken,
  authorize('admin_pusat', 'admin_kabkota'),
  userController.getUserById
);

/**
 * @swagger
 * /users:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     summary: Create new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - roleId
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               regionId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/', [
  verifyToken,
  authorize('admin_pusat'),
  body('username').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('roleId').isInt(),
  validate
], userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     summary: Update user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               regionId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', [
  verifyToken,
  authorize('admin_pusat'),
  body('email').optional().isEmail(),
  body('roleId').optional().isInt(),
  validate
], userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id',
  verifyToken,
  authorize('admin_pusat'),
  userController.deleteUser
);

/**
 * @swagger
 * /users/{id}/change-password:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     summary: Change user password
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/:id/change-password', [
  verifyToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate
], userController.changePassword);

module.exports = router;