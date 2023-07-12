import {
    checkUser,
    createUser,
    deleteUser,
    isAuth,
    login,
    logout,
    readUser,
    updateUser,
    validateCreateUser,
    validateUpdateUser,
} from '../controllers/userController';

const userRoutes = (app) => {

    app.route('/user/signup')
        .post(validateCreateUser, checkUser, createUser);
    app.route('/user/login')
        .post(login);
    app.route('/user/logout')
        .get(isAuth, logout);
    app.route('/user')
        .get(isAuth, readUser)
        .put(isAuth, validateUpdateUser, checkUser, updateUser)
        .delete(isAuth, deleteUser);
}

export default userRoutes;