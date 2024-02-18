import express from "express"
import userController from '../controllers/user-controller.js'
import postController from '../controllers/post-controller.js'

const router = express.Router()

import { body } from 'express-validator'
import {authMiddleware} from '../middlewares/auth-middleware.js'

// post
router.post('/registration', body('email').isEmail(), body('password').isLength({ min: 3, max: 32 }), body('username').isLength({ min: 2, max: 20 }), userController.registration);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/send/supportEmail', userController.sendEmail);

// read
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/update/:username', authMiddleware, userController.update);
router.get('/users', userController.getUsers);

router.get('/profile/:username', userController.getUser);

router.get('/posts', postController.getFeedPosts);
router.get('/chicClips', postController.getFeedClips);
router.get('/chicClips/:id', postController.getClip);
router.get('/:user/posts', postController.getUserPosts);
router.get('/:id/post', postController.getUserPost);
router.delete('/:id/delete', authMiddleware, postController.deletePost);

// update
router.patch("/:id/:like", authMiddleware, postController.likePost)
router.put("/:id/comment", authMiddleware, postController.commentPost)
router.put("/delete/:id/comment/:idComm", authMiddleware, postController.deleteComment)



export default router;