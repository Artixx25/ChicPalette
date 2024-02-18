export default class ApiError extends Error {
    status;
    errors;

    constructor(status, message, errorrs = []) {
        super(message);
        this.status = status;
        this.errors = errorrs;
    }

    static UnauthorizedError() {
        return new ApiError(401, 'User is not authorized')
    }

    static BadRequest(message, errors=[]) {
        return new ApiError(400, message, errors)
    }
}