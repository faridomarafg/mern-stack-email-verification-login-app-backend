const router = require("express").Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);


router.post('/login', userController.login);

//email verification route
router.get('/:id/verify/:token/', userController.emailVerification);

module.exports = router;