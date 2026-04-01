'use strict';

// routes/authRoutes.js

const express       = require('express');
const router        = express.Router();
const rateLimit     = require('express-rate-limit');
const multer        = require('multer');
const authController= require('../controllers/authController');
const authenticate  = require('../middleware/authenticate');
const loginRL       = require('../middleware/loginRateLimit');
const { doubleCsrfProtection } = require('../middleware/csrfProtection');
const rlConfig      = require('../config/rateLimitConfig');

const registerRL = rateLimit({
  ...rlConfig.register,
  message: { error: 'Too many registrations from this IP. Try again in 1 hour.' },
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Unsupported avatar file type'));
    }
    cb(null, true);
  },
});

router.post('/register',              registerRL,                   authController.register);
router.post('/login',                 loginRL,                      authController.login);
router.post('/logout',                authenticate, doubleCsrfProtection, authController.logout);
router.post('/refresh',                                              authController.refresh);
router.get('/me',                     authenticate,                 authController.me);
router.get('/avatar',                 authenticate,                 authController.getAvatar);
router.post('/avatar',                authenticate, doubleCsrfProtection, avatarUpload.single('avatar'), authController.uploadAvatar);
router.delete('/account',             authenticate, doubleCsrfProtection, authController.deleteAccount);
router.get('/verify',                                               authController.verifyEmail);
router.post('/resend-verification',   registerRL,                   authController.resendVerification);

module.exports = router;
