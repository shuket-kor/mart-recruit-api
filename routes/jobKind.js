var express = require('express');
var router = express.Router();

const { create, update, remove, list } = require('../app/controllers/jobKind.js');

<<<<<<< .merge_file_a02812
/* GET home page. */
=======
router.get('/create', create);

router.get('/update', update);

router.get('/remove', remove);

>>>>>>> .merge_file_a18124
router.get('/list', list);

module.exports = router;
