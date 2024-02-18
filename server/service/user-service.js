import UserModel from '../models/user-model.js'
import PostModel from '../models/project-model.js';
import bcrypt from 'bcrypt'
import { v4 as uuid } from "uuid";
import mailService from './mail-service.js'
import tokenService from './token-service.js'
import UserDto from '../dtos/user-dto.js'
import ApiError from '../exeptions/api-error.js'
import RoleModel from '../models/role-model.js';
import fs from 'fs'
import path from 'path'

class UserService {
    async register(fullname, email, username, password) {
        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest('User with this email or username already exists')
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid();
        const userRole = await RoleModel.findOne({ value: 'User' })
        const user = await UserModel.create({ fullname, email, username, password: hashPassword, activationLink, roles: [userRole.value] })
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async login(email, password) {
        const user = await UserModel.findOne({ email })

        if (!user) {
            throw ApiError.BadRequest('User with those credits was not found')
        }
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw ApiError.BadRequest('Incorrect password')
        }

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto }
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({ activationLink })

        if (!user) {
            throw ApiError.BadRequest('Incorrect activation link')
        }
        user.isVerificated = true;
        await user.save();
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError()
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }

        const user = await UserModel.findById(userData.id)
        const posts = await PostModel.find()
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto, posts: posts }
    }

    async getAllUsers() {
        const users = await UserModel.find().sort({_id: -1})
        return users;
    }

    async getUser(username) {
        const user = await UserModel.findOne({ username })
        if (!user) {
            throw ApiError.BadRequest('User not found')
        }
        return user
    }

    async update(username) {
        if (!username) {
            throw ApiError.BadRequest()
        }
        const user = await UserModel.findOne({ username })
        const userDto = new UserDto(user)
        const posts = await PostModel.find()

        return { user: userDto, posts: posts }
    }

    async editUserProfile(username, updatedUsername, avatar, coverImage, fullname, description) {
        const prevUser = await UserModel.findOne({ username })

        if (prevUser.avatar !== avatar && prevUser.avatar !== undefined) {
            fs.unlink(path.join("public/profiles/" + prevUser.avatar), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        }

        if (prevUser.coverImage !== coverImage && prevUser.coverImage !== undefined) {
            fs.unlink(path.join("public/profiles/" + prevUser.coverImage), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        }

        const editingUser = await UserModel.findOneAndUpdate({ username }, { username: updatedUsername, avatar, coverImage, fullname, description }, { new: true })
        await PostModel.updateMany(
            { 'comments.userId': editingUser._id }, // Find all posts where the user has commented
            {
                $set: {
                    'comments.$[elem].userAvatar': avatar,
                    'comments.$[elem].username': updatedUsername // Update the user avatar for all matching comments
                }
            },
            { arrayFilters: [{ 'elem.userId': editingUser._id }] }
        );

        const posts = await PostModel.find()

        return { user: editingUser, posts: posts };
    }
}

export default new UserService();