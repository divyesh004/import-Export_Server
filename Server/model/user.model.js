const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserModel {
  static async createUser(userData) {
    const { name, email, password, role, phone, company_name = null, address = null } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          company_name,
          address
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  }

  static async findByEmail(email) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }

    return user;
  }

  static async findById(id) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return user;
  }

  static async updateUser(id, updateData) {
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  }

  static async findByRole(role) {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role);

    if (error) {
      throw new Error(error.message);
    }

    return users;
  }

  static generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = UserModel;