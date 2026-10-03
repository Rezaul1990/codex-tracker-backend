const express = require("express");

const { removeAttachment } = require("../controllers/attachmentController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.delete("/:id", removeAttachment);

module.exports = router;
