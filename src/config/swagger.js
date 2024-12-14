// src/config/swagger.js
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// swagger.yaml 파일의 절대 경로를 지정
const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger.yaml'));

module.exports = {
    swaggerUi,
    swaggerDocument
};