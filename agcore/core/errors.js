class UserNotFound extends Error {
    constructor() {
        super();
        Error.captureStackTrace(this, UserNotFound);
        this.name = 'UserNotFound';
        this.message = 'User Not Found';
        this.status = 400;
    }
}

class ForbiddenError extends Error {
    constructor() {
        super();
        Error.captureStackTrace(this, ForbiddenError);
        this.name = 'ForbiddenError';
        this.message = 'Forbidden Error';
        this.status = 403;
    }
}

class AuthError extends Error {
    constructor() {
        super();
        Error.captureStackTrace(this, AuthError);
        this.name = 'AuthError';
        this.message = 'Authorize Error.';
        this.status = 401;
    }
}


class ComingSoon extends Error {
    constructor(message) {
        super();
        this.message = message ? message : 'Function is coming soon.';
        this.name = 'ComingSoon';
        this.status = 500;
    }
}


class InsideError extends Error {
    constructor(message, args) {
        super();
        this.message = message ? message : 'Intrenal error';
        this.name = 'InternalError';
        this.status = 500;
        this.args = args;
    }
}

module.exports = {
    ForbiddenError,
    AuthError,
    ComingSoon,
    InsideError,
    UserNotFound
};