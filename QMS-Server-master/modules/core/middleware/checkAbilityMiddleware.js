const ApiError = require("../../../error/ApiError");

module.exports = function (requiredSlug) {
    return function (req, res, next) {
        if (req.method === "OPTIONS") return next();

        try {
            const user = req.user;
            if (!user) return next(ApiError.unauthorized("Нет пользователя"));


            if (user.role === 'SUPER_ADMIN') {
                return next();
            }


            if (user.abilities && user.abilities.includes(requiredSlug)) {
                return next();
            }

            return next(ApiError.forbidden(`Нет доступа. Требуется право: ${requiredSlug}`));

        } catch (e) {
            return next(ApiError.internal("Ошибка проверки прав"));
        }
    };
};
