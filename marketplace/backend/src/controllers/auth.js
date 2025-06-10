import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Kayıt ol
export const register = async (req, res) => {
  try {
    const { email, password, isCreator } = req.body;

    // Validasyon
    if (!email || !password) {
      return res.status(400).json({
        message: 'Lütfen tüm alanları doldurun'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Geçerli bir email adresi giriniz'
      });
    }

    // Email kontrolü
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Bu email adresi zaten kullanımda' 
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      email,
      password,
      isCreator: isCreator || false
    });

    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id,
        isCreator: user.isCreator 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: {
        id: user._id,
        email: user.email,
        isCreator: user.isCreator
      }
    });

  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ 
      message: 'Kullanıcı oluşturulurken bir hata oluştu', 
      error: error.message 
    });
  }
};

// Giriş yap
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasyon
    if (!email || !password) {
      return res.status(400).json({
        message: 'Lütfen email ve şifre giriniz'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Bu email adresi ile kayıtlı kullanıcı bulunamadı' 
      });
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Geçersiz şifre' 
      });
    }

    // JWT token oluştur
    console.log('Login - Creating token with:', {
      userId: user._id,
      isCreator: user.isCreator,
      JWT_SECRET: process.env.JWT_SECRET
    });

    const token = jwt.sign(
      { 
        userId: user._id,
        isCreator: user.isCreator 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login - Token created:', token);

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user._id,
        email: user.email,
        isCreator: user.isCreator,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ 
      message: 'Giriş yapılırken bir hata oluştu', 
      error: error.message 
    });
  }
};

// Tüm kullanıcıları listele (Admin için)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Kullanıcılar listelenirken bir hata oluştu', 
      error: error.message 
    });
  }
};

// Mevcut kullanıcı bilgilerini getir
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata:', error);
    res.status(500).json({ 
      message: 'Kullanıcı bilgileri alınırken bir hata oluştu', 
      error: error.message 
    });
  }
}; 