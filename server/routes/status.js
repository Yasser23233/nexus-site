const express = require('express');
const router = express.Router();
let getUserStatusFn = () => ({ status: 'offline', lastActive: null });

// allow socket module to register status function
router.setStatusFn = fn => { getUserStatusFn = fn; };

router.get('/:username', (req, res) => {
  const { username } = req.params;
  const status = getUserStatusFn(username);
  res.json(status);
});

module.exports = router;
