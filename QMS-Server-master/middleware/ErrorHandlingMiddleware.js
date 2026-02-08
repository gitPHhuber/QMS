const ApiError = require("../error/ApiError");

module.exports = function (err, req, res, next) {

    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.error(`\x1b[31m[${time}] ERROR:\x1b[0m ${req.method} ${req.url}`);


    if (!(err instanceof ApiError)) {
        console.error(err);
    } else {
        console.error(`ApiError: ${err.message}`);
    }


    if (err instanceof ApiError) {
        return res.status(err.status).json({
            message: err.message,
            errors: err.errors
        });
    }


    if (err.name === 'UnauthorizedError' || err.status === 401) {
        return res.status(401).json({
            message: "Пользователь не авторизован (Invalid Token)"
        });
    }
    if (err.name === 'InvalidTokenError') {
        return res.status(401).json({
            message: "Некорректный токен или срок действия истек"
        });
    }
    if (err.status === 403) {
        return res.status(403).json({
            message: "Нет доступа (Forbidden)"
        });
    }


    if (err.name === 'SequelizeUniqueConstraintError') {

        return res.status(409).json({
            message: "Запись с такими данными уже существует",
            details: err.errors.map(e => e.message)
        });
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            message: "Ошибка валидации данных",
            details: err.errors.map(e => e.message)
        });
    }

    if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
            message: "Нет подключения к базе данных"
        });
    }


    return res.status(500).json({
        message: "Непредвиденная ошибка сервера",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
