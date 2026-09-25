const express = require("express");

const router = express.Router();

const trackers = [
  {
    id: 1,
    title: "Frontend setup",
    status: "completed",
  },
  {
    id: 2,
    title: "Backend API setup",
    status: "completed",
  },
  {
    id: 3,
    title: "Database connection",
    status: "pending",
  },
];

router.get("/", (req, res) => {
  res.json({
    data: trackers,
  });
});

router.post("/", (req, res) => {
  const { title, status = "pending" } = req.body;

  if (!title) {
    return res.status(400).json({
      message: "title is required",
    });
  }

  const tracker = {
    id: trackers.length + 1,
    title,
    status,
  };

  trackers.push(tracker);

  return res.status(201).json({
    data: tracker,
  });
});

module.exports = router;
