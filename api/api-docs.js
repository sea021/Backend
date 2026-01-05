const swaggerUi = require('swagger-ui-express');
const { specs } = require('../swagger');

module.exports = (req, res) => {
  swaggerUi.setup(specs)(req, res);
};
