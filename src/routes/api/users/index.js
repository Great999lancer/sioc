const model = global.app.model;
const {hash} = global.app.security;
const sessionSecret = global.app.config.auth.sessionSecret;
const {split} = require('lodash');
const jwt = require('jsonwebtoken');

module.exports = router => {

    router.post('/', async (req, res, next) => {
        try {
            const count = await model.User.count({email: req.body.user.email}).exec();
            if (count) {
                return res.status(409).send({message: 'User Name or email is already taken'});
            }
            const user = new model.User(req.body.user);
            user.role = model.enums.roles.USUARIO;
            user.password = hash(user.password);
            await user.save();
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    });

    router.get('/profile', (req, res, next) => {
        const header = req.get('Authorization');
        if (!header) {
            return res.sendStatus(401);
        }
        const token = split(header, /\s+/).pop();
        if (!token) {
            return res.sendStatus(401);
        }
        try {
            const decoded = jwt.verify(token, sessionSecret);
            model.User.findOne({username: decoded.sub}, {password: 0}).exec().then(
                user => res.send({user})
            ).catch(next);
        } catch (err) {
            return res.send(false);
        }
    });

    router.get('/byRole', async (req, res, next) => {
        if (req.query.role === 'captain') {
            try {
                const users = await model.User.find({captain: true}).exec();
                res.send({users});
            } catch (err) {
                next(err);
            }
        } else {
            try {
                const users = await model.User.find({role: req.query.role}).exec();
                res.send({users});
            } catch (err) {
                next(err);
            }
        }
    });

    router.get('/search', async (req, res, next) => {
        const query = {};
        query['name'] = {$regex: '.*' + req.query.q + '.*', $options: 'i'};
        if (req.query.userType === 'martillero'){
            query['role'] = req.query.userType;
        }else if (req.query.userType=== 'capitan') {
            query['captain'] = true;
        }
        try {
            const users = await model.User.find({
                '$and': [query]}).exec();
            res.send({users});
        } catch (err) {
            next(err);
        }
    });

    router.put('/changeRole', async (req, res, next) => {
        if (req.body.captain) {
            try {
                await model.User.findByIdAndUpdate(req.body.id, {$set: {captain: req.body.captain}}).exec();
                const users = await model.User.find({captain: true}).exec();
                res.send({users});
            } catch (err) {
                next(err);
            }
        } else {
            try {
                await model.User.findByIdAndUpdate(req.body.id, {$set: {role: req.body.newRole}}).exec();
                const users = await model.User.find({role: req.body.oldRole ? req.body.oldRole : req.body.newRole}).exec();
                res.send({users});
            } catch (err) {
                next(err);
            }
        }
    });
    return router;
};
