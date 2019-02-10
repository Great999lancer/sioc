const model = global.app.model;


module.exports = router => {
    router.post('/', (req, res, next) => {
        const agency = new model.Agency(req.body.agency);
        agency.save().then(
            () => res.send({success: true})
        ).catch(next);
    });

    router.get('/', async (req, res, next) => {
        try {
            const agencies = await model.Agency.find({}).sort('-createdAt').
                populate('auctioneer.user', '-password').populate('captain.user', '-password').lean().exec();
            res.send({agencies});
        } catch (err) {
            next(err);
        }
    });

    router.put('/:id', async (req, res, next) => {
        try {
            await model.Agency.findByIdAndUpdate(req.params.id, req.body.Agency).exec();
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });
    return router;
};
