const corsOptions = {
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://manage-task-frontend-url.onrender.com',
  ],
  credentials: true
};

module.exports = corsOptions;
