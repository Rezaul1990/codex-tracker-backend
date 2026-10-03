const fs = require("fs");
const path = require("path");

const multer = require("multer");

const uploadRoot = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(uploadRoot, { recursive: true });

const sanitizeFileName = (fileName) =>
  String(fileName || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (req, file, callback) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniquePrefix}-${sanitizeFileName(file.originalname)}`);
  },
});

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  storage,
});

const removeStoredFile = async (storageKey) => {
  if (!storageKey) {
    return;
  }

  const filePath = path.join(uploadRoot, storageKey);

  if (!filePath.startsWith(uploadRoot)) {
    return;
  }

  await fs.promises.unlink(filePath).catch(() => {});
};

module.exports = {
  removeStoredFile,
  upload,
};
