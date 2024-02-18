import PostModel from "../models/project-model.js"
import url from 'url'
import fs from 'fs'
import path from "path";
import ClipModel from "../models/clip-model.js";
import ApiError from '../exeptions/api-error.js';

class postController {
    async createPost(req, res, next) {
        try {
            const { user, name, subDescription, additionalImages, previewImage, category, createType, video } = req.body;
            if (createType === 'Photos') {
                const newPost = new PostModel({
                    user,
                    name,
                    subDescription,
                    previewImage,
                    comments: [],
                    likes: {},
                    additionalImages: JSON.parse(additionalImages),
                    category
                })
                await newPost.save()
                const post = await PostModel.find();
                return res.json(post)
            } else if (createType === 'ChicClips') {
                const newClip = new ClipModel({
                    user,
                    name,
                    subDescription,
                    comments: [],
                    likes: {},
                    category,
                    video
                })
                await newClip.save()
                const clip = await ClipModel.find();
                return res.json(clip)
            } else {
                return next(ApiError.BadRequest('Invalid creation type'));
            }
        } catch (error) {
            next(error)
        }
    }

    async getClip(req, res, next) {
        try {
            const {id} = req.params;
            const clip = await ClipModel.findById(id).populate('user', 'username avatar');
            return res.json(clip)
        } catch (e) {
            next(e)
        }
    }

    async getFeedClips(req, res, next) {
        try {
            const ResultsLimit = 5;
            const { _page = 0, _filter, _sphere } = req.query;
            const page = parseInt(_page, 10) || 0;
            let sortType = {};
    
            // Determine sort type based on filter
            if (_filter === 'latest') {
                sortType = { createdAt: -1 };
            } else if (_filter === 'mostLiked') {
                sortType = { likesCount: -1 };
            } else {
                sortType = { createdAt: 1 };
            }
    
            // Define the aggregation pipeline to fetch feed clips
            const pipeline = [
                {
                    $addFields: {
                        likesCount: {
                            $reduce: {
                                input: { $objectToArray: '$likes' },
                                initialValue: 0,
                                in: { $cond: ['$$this.v', { $add: ['$$value', 1] }, '$$value'] },
                            },
                        },
                    },
                },
                { $sort: sortType },
                { $skip: ResultsLimit * page },
                { $limit: ResultsLimit },
            ];
            if (_sphere) {
                pipeline.unshift({ $match: { category: _sphere } });
            }
    
            // Execute the aggregation pipeline
            const clips = await ClipModel.aggregate(pipeline);
    
            // Populate user information for each clip
            await ClipModel.populate(clips, { path: 'user', select: 'username avatar' });
    
            // Return the fetched feed clips
            return res.json(clips);
        } catch (error) {
            next(error);
        }
    }

    async getFeedPosts(req, res, next) {
        try {
            const ResultsLimit = 19;
            const urlParams = url.parse(req.url, true).query;
            const page = parseInt(urlParams._page, 10) || 0;
            let sortType;
            if (urlParams._filter === 'latest') {
                sortType = { _id: -1 };
            } else if (urlParams._filter === 'Most Liked') {
                sortType = { likesCount: -1 };
            } else {
                sortType = { _id: 1 };
            }

            const posts = await PostModel.aggregate([
                { $match: { category: urlParams._sphere } },
                {
                    $addFields: {
                        likesCount: {
                            $sum: {
                                $map: {
                                    input: { $objectToArray: '$likes' },
                                    as: 'like',
                                    in: { $cond: [{ $eq: ['$$like.v', true] }, 1, 0] },
                                },
                            },
                        },
                    },
                },
                { $sort: sortType },
                { $skip: ResultsLimit * page },
                { $limit: ResultsLimit },
            ]);

            await PostModel.populate(posts, { path: 'user', select: 'username avatar' });

            return res.json(posts);
        } catch (e) {
            next(e);
        }
    }

    async getUserPosts(req, res, next) {
        try {
            const { user } = req.params;
            if (user == undefined || user == null) {
                return res.status(400).json({ error: 'User parameter is missing or invalid' });
            }
            const userPosts = await PostModel.find({ user }).populate('user', 'username avatar');
            const likedPosts = await PostModel.find({ [`likes.${user}`]: true }).populate('user', 'username avatar');
            return res.json({ userPosts, likedPosts })
        } catch (e) {
            next(e)
        }
    }

    async getUserPost(req, res, next) {
        try {
            const { id } = req.params;
            const post = await PostModel.findById(id).populate('user', 'username avatar');
            return res.json(post)
        } catch (e) {
            next(e)
        }
    }

    async likePost(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            const post = await PostModel.findById(id)
            const isLiked = post.likes.get(userId)

            if (isLiked) post.likes.delete(userId)
            else post.likes.set(userId, true)

            const updatedPost = await PostModel.findByIdAndUpdate(id,
                { likes: post.likes },
                { new: true }
            );

            return res.json(updatedPost)
        } catch (e) {
            next(e)
        }
    }

    async deletePost(req, res, next) {
        try {
            const { id } = req.params
            const post = await PostModel.findByIdAndDelete(id)

            fs.unlink(path.join("public/assets/" + post.previewImage), (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })

            for (const additional of post.additionalImages) {
                fs.unlink(path.join("public/assets/" + additional), (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                })
            }
            return res.json(post)
        } catch (e) {
            next(e)
        }
    }

    async commentPost(req, res, next) {
        try {
            const { id } = req.params
            const { userId, username, userAvatar, comment, userRoles } = req.body

            const post = await PostModel.findById(id).populate('user', 'username avatar');

            const newComment = {
                userId,
                comment,
                userAvatar,
                username,
                userRoles
            }


            post.comments.push(newComment);
            post.comments.sort((a, b) => b.createdAt - a.createdAt);
            // Save the updated post
            await post.save();

            return res.json(post)
        } catch (e) {
            next(e)
        }
    }

    async deleteComment(req, res, next) {
        try {
            const { id, idComm } = req.params

            const post = await PostModel.findById(id).populate('user', 'username avatar');
            const commentRemove = post.comments.filter(comm => comm.id !== idComm);
            post.comments = commentRemove;

            await post.save();

            return res.json(post);
        } catch (e) {
            next(e)
        }
    }
}

export default new postController();