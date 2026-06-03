const { nanoid } = require("nanoid");

const generateShortCode = () => {
  return nanoid(6);
};

module.exports = generateShortCode;