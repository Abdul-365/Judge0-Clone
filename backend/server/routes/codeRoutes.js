import {
    executeCode,
    saveCode
} from '../controllers/codeController';

const codeRoutes = (app) => {

    app.route('/code/execute')
        .post(executeCode);
    app.route('/code/save')
        .post(saveCode);
}

export default codeRoutes;