const { validationResult, body } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const userValidationRules = {
  updateProfile: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
    body('address').optional().notEmpty().withMessage('Address cannot be empty'),
    body('country').optional().notEmpty().withMessage('Country cannot be empty'),
    body('company_name').optional().notEmpty().withMessage('Company name cannot be empty')
  ],

  signup: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[^\w\s]/).withMessage('Password must contain at least one special character'),
    body('role').isIn(['admin', 'seller', 'customer', 'sub-admin']).withMessage('Invalid role'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('country').notEmpty().withMessage('Country is required'),
    body('company_name').optional(),
    body('industry').custom((value, { req }) => {
      if (req.body.role === 'sub-admin' && !value) {
        throw new Error('Industry is required for sub-admin accounts');
      }
      return true;
    })
  ],
  login: [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  forgotPassword: [
    body('email').isEmail().withMessage('Invalid email format')
  ],
  resetPassword: [
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ]
};

const productValidationRules = {
  create: [
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .notEmpty().withMessage('Product category is required')
      .isIn(['electronics', 'clothing', 'accessories', 'footwear', 'electronics', 'home', 'beauty'])
      .withMessage('Invalid product category'),
    body('imageUrls').isArray().withMessage('Images must be an array').custom((value) => {
      if (!value || value.length === 0) {
        throw new Error('At least one image is required');
      }
      return true;
    })
  ],
  update: [
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .optional()
      .notEmpty().withMessage('Product category cannot be empty')
      .isIn(['electronics', 'clothing', 'accessories', 'footwear', 'electronics', 'home', 'beauty'])
      .withMessage('Invalid product category'),
    body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
  ]
};

const orderValidationRules = {
  create: [
    body('product_id').isUUID().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  updateStatus: [
    body('status').isIn(['pending', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
  ]
};

const cartValidationRules = {
  addItem: [
    body('product_id').isUUID().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ]
};

const qaValidationRules = {
  question: [
    body('product_id').isUUID().withMessage('Invalid product ID'),
    body('question').notEmpty().withMessage('Question is required')
  ],
  answer: [
    body('answer').notEmpty().withMessage('Answer is required')
  ]
};

module.exports = {
  validateRequest,
  userValidationRules,
  productValidationRules,
  orderValidationRules,
  cartValidationRules,
  qaValidationRules
};