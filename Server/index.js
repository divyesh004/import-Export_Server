require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const authRouter = require('./Router/auth_router');


const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 40000000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000
});
app.use(limiter);

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'B2B Import-Export API',
      version: '1.0.0',
      description: 'API documentation for B2B Import-Export platform'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./Router/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/auth', require('./Router/auth_router'));
app.use('/products', require('./Router/product.router'));
app.use('/orders', require('./Router/order.router'));
app.use('/cart', require('./Router/cart.router'));
app.use('/qa', require('./Router/qa.router'));
app.use('/product-requests', require('./Router/product_request.router'));
app.use('/analytics', require('./Router/analytics.router'));
app.use('/price', require('./Router/price.router'));


// Error handling middleware
app.use((err, req, res, next) => {
  // Only log errors in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  // Only log server startup information in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  }
});
