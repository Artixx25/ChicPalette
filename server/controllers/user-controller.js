import userService from '../service/user-service.js'
import {validationResult} from 'express-validator'
import ApiError from '../exeptions/api-error.js';
import PostModel from '../models/project-model.js';
import mailService from '../service/mail-service.js';
import kickbox from 'kickbox'

class userController {
    // registration
    async registration(req, res, next) {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Validation Error', errors.array()));
            }
            const {fullname, email, username, password} = req.body
            const userData = await userService.register(fullname, email, username, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            next(e)
        }
    }

    // login
    async login(req, res, next) {
        try {
            const {email, password} = req.body;
            const userData = await userService.login(email, password)

            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            next(e)
        }
    }

    // logout
    async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken)
            res.clearCookie('refreshToken')
            return res.json(token)
        } catch (e) {
            next(e)
        }
    }

    // activate
    async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink)
            return res.redirect(process.env.CLIENT_URL)
        } catch (e) {
            next(e)
        }
    }

    // refresh
    async refresh(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const userData = await userService.refresh(refreshToken)
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            next(e)
        }
    }

    async update(req, res, next) {
        try {
            const {username} = req.params
            const userData = await userService.update(username)
            return res.json(userData);
        } catch (e) {
            next(e)
        }
    }

    // getUsers
    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers()
            return res.json(users)
        } catch (e) {
            next(e)
        }
    }

    async getUser(req,res,next) {
        try {
            const {username} = req.params;
            const user = await userService.getUser(username);
            return res.json(user);
        } catch (e) {
            next(e)
        }
    }

    async editUserProfile(req,res,next) {
        try {
            const {username} = req.params;
            const {updatedUsername, avatar, coverImage, fullname, description} = req.body
            const editing = await userService.editUserProfile(username, updatedUsername, avatar, coverImage, fullname, description);
            return res.json(editing);
        } catch (e) {
            next(e)
        }
    }

    async sendEmail(req, res, next) {
        try {
            const {from, userId, username, fullname, subject, description} = req.body
            const antiSpam = kickbox.client(process.env.ANTISPAM_API).kickbox()
            await antiSpam.verify(from.toString(), async function (err, response) {
                const data = response.body
                console.log(data)
                if((data.result == 'deliverable' || data.result == 'risky') && (data.reason == 'accepted_email' || data.reason == 'low_deliverability' || data.reason == 'low_quality')) {
                    await mailService.sendSuppMail({from, userId, username, fullname, subject, description})
                    return res.json('success')
                }
                return res.json('error')
              });

        } catch(e) {
            next(e)
        }
    }
}

export default new userController();