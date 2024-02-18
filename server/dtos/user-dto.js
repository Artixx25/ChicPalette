export default class UserDto {
    fullname;
    email;
    avatar;
    coverImage;
    id;
    username;
    isVerificated;
    createdAt;
    description;
    roles;

    constructor(model) {
        this.fullname = model.fullname;
        this.email = model.email;
        this.id = model._id;
        this.username = model.username;
        this.avatar = model.avatar;
        this.coverImage = model.coverImage;
        this.isVerificated = model.isVerificated;
        this.createdAt = model.createdAt;
        this.description = model.description;
        this.roles = model.roles
    }
}