const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Moneyboi API',
        description: 'Moneyboi is an expense tracker app',
    },
    host: 'localhost:3000',
    schemes: ['http'],
    definitions: {
        AddUser: {
            $email: "user@email.com",
            $name: "John Doe",
            password: ""
        }
    }
};

const outputFile = './swagger.json';
const endpointsFiles = ['./index.js'];



/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc);