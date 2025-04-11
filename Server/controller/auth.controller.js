const UserModel = require('../model/user.model');
const supabase = require('../config/supabase');

class AuthController {
  // Register new user
  static async signup(req, res) {
    try {
      const { email, password, name, role, phone, company_name, address, country } = req.body;

      // Validate required fields
      if (!email || !password || !name || !role || !country) {
        return res.status(400).json({ error: 'Email, password, name, role, and country are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
      }
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
      }

      // Validate name
      if (name.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
      }
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ error: 'Name can only contain letters and spaces' });
      }

      // Validate role
      const validRoles = ['customer', 'seller', 'admin', 'sub-admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Additional validations for seller role
      if (role === 'seller') {
        if (!company_name) {
          return res.status(400).json({ error: 'Company name is required for seller accounts' });
        }
        if (!address) {
          return res.status(400).json({ error: 'Address is required for seller accounts' });
        }
        if (!country) {
          return res.status(400).json({ error: 'Country is required for seller accounts' });
        }
      }
      
      // Additional validations for sub-admin role
      if (role === 'sub-admin') {
        if (!req.body.industry) {
          return res.status(400).json({ error: 'Industry is required for sub-admin accounts' });
        }
      }

      // Validate phone format if provided
      if (phone) {
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }
      }

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // First create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw new Error(authError.message);

      // Then create user in our database
      const user = await UserModel.createUser({
        ...req.body,
        auth_id: authData.user.id
      });

      const token = UserModel.generateToken(user.id);
      res.status(201).json({ user, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      // First authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw new Error(authError.message);

      // Then get user from our database
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'User not found in database' });
      }

      const token = UserModel.generateToken(user.id);
      res.json({ user, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const allowedUpdates = ['name', 'phone', 'address', 'company_name', 'country'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const user = await UserModel.updateUser(req.user.id, updates);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get users by role (Admin only)
  static async getUsersByRole(req, res) {
    try {
      const users = await UserModel.findByRole(req.params.role);
      res.json(users);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Approve seller account (Admin only)
  static async approveSeller(req, res) {
    try {
      const user = await UserModel.updateUser(req.params.id, { status: 'approved' });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // This function has been merged with banUser function
  // Keeping this comment for reference

  // Change user role (Admin only)
  static async changeUserRole(req, res) {
    try {
      // Verify that the current user is an admin (not a sub-admin)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin users can change user roles' });
      }

      const { role } = req.body;
      const validRoles = ['customer', 'seller', 'admin', 'sub-admin'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Additional validation for sub-admin role
      if (role === 'sub-admin' && !req.body.industry) {
        return res.status(400).json({ error: 'Industry is required for sub-admin accounts' });
      }

      // Prepare update data
      const updateData = { role };
      if (role === 'sub-admin' && req.body.industry) {
        updateData.industry = req.body.industry;
      }

      const user = await UserModel.updateUser(req.params.id, updateData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Forgot password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate reset token using Supabase
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CLIENT_URL}/reset-password`
      });
      if (error) throw new Error(error.message);

      res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { new_password, token } = req.body;

      if (!token) {
        return res.status(401).json({ error: 'Reset token is required' });
      }

      // Verify token and update password in Supabase
      const { data: session, error: sessionError } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery'
      });

      if (sessionError) {
        return res.status(401).json({ error: 'Invalid or expired reset token' });
      }

      // Update password
      const { data, error } = await supabase.auth.updateUser({
        password: new_password
      });

      if (error) throw new Error(error.message);

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AuthController;