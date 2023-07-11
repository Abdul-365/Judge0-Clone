import {
    createUser,
    deleteUser,
    isAuth,
    login,
    logout,
    readUser,
    updateUser
} from '../controllers/userController';

const userRoutes = (app) => {
    
    app.route('/user/signup')
        .post(createUser);
    app.route('/user/login')
        .post(login);
    app.route('/user/logout')
        .get(isAuth, logout);
    app.route('/user')
        .get(isAuth, readUser)
        .put(isAuth, updateUser)
        .delete(isAuth, deleteUser);
}

export default userRoutes;