var express = require('express');
var router = express.Router();

const indexPath =  __dirname.replace('routes', '').replace('server/','').replace('server\\','') + 'webui/index.html';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendfile(indexPath);
});

router.get('/*', function (req, res, next) {
  res.sendfile(indexPath);
});

module.exports = router;
