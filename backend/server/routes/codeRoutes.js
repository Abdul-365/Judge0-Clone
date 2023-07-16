import {
    checkValidation,
    createCode,
    deleteCode,
    executeCode,
    readCode,
    updateCode,
    validateCreateCode,
    validateExecuteCode,
    validateUpdateCode,
} from '../controllers/codeController';
import { isAuth } from './../controllers/userController';

const codeRoutes = (app) => {

    app.route('/code/execute')
        .post(validateExecuteCode, checkValidation, executeCode);
    app.route('/code')
        .post(isAuth, validateCreateCode, checkValidation, createCode);
    app.route('/code/:codeId')
        .get(isAuth, readCode)
        .put(isAuth, validateUpdateCode, checkValidation, updateCode)
        .delete(isAuth, deleteCode);
}

export default codeRoutes;