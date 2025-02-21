require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

module.exports = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || "metro.proxy.rlwy.net",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "CmiCpglHvbxFRAwVnZkGKGPgJmkYFOnl",
    name: process.env.DB_NAME || "ikea",
    port: process.env.DB_PORT || 80,
  },
  secretKey: process.env.SECRET_KEY || "default_secret",
};
