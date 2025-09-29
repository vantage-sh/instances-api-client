export class APIError extends Error {}

export class UnknownHTTPError extends APIError {
    constructor(
        public status: number,
        public statusText: string,
    ) {
        super(`Unknown HTTP error: ${status} ${statusText}`);
        this.name = "UnknownHTTPError";
    }
}

export class InvalidRequestError extends APIError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidRequestError";
    }
}

export class UnauthorizedError extends APIError {
    constructor(message: string) {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export class InternalServerError extends APIError {
    constructor(message: string) {
        super(message);
        this.name = "InternalServerError";
    }
}

export class RateLimitExceededError extends APIError {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitExceededError";
    }
}

export class NotFoundError extends APIError {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

export const errors = {
    INVALID_REQUEST: InvalidRequestError,
    UNAUTHORIZED: UnauthorizedError,
    INTERNAL_SERVER_ERROR: InternalServerError,
    RATE_LIMIT_EXCEEDED: RateLimitExceededError,
    NOT_FOUND: NotFoundError,
};
