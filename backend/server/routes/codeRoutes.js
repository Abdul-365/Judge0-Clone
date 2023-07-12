import {
    checkCode,
    createCode,
    executeCode,
    readCode,
    updateCode,
    validateCreateCode,
    validateUpdateCode,
} from '../controllers/codeController';
import { isAuth } from './../controllers/userController';

const codeRoutes = (app) => {

    app.route('/code/execute')
        .post(executeCode);
    app.route('/code')
        .post(isAuth, validateCreateCode, checkCode, createCode);
    app.route('/code/:codeId')
        .get(isAuth, readCode)
        .put(isAuth, validateUpdateCode, checkCode, updateCode);
}

export default codeRoutes;