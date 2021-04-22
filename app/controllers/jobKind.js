const jobKindService = require('../services/jobKind.js');

module.exports = {
    async create(req, res, next) {
        const jobKindName = req.query.jobKind;

        await jobKindService.create(jobKindName);

        res.status(200).json({
            result: 'success'
        });
    },

    async update(req, res, next) {
        const jobKindSeq = req.query.seq;
        const jobKindName = req.query.jobKind;

        await jobKindService.update(jobKindSeq, jobKindName);

        res.status(200).json({
            result: 'success'
        });
    },

    async remove(req, res, next) {
        const jobKindSeq = req.query.seq;

<<<<<<< HEAD
<<<<<<< .merge_file_a17472
        const result = await jobKindService.delete(jobKindSeq);
=======
        const result = await jobKindService.remove(jobKindSeq);
>>>>>>> .merge_file_a07712
=======
        const result = await jobKindService.remove(jobKindSeq);
>>>>>>> 74f6b46bf433f617a8a588d168a46456d40b7fcb

        res.status(200).json({
            result: 'success',
            data: result
        });
    },

    async list(req, res, next) {
        const list = await jobKindService.list();

        res.status(200).json({
            result: 'success',
            data: list
        });
    }


}

