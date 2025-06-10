import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
    try {
        // Debug logs
        console.log('Auth middleware - JWT_SECRET:', process.env.JWT_SECRET);
        console.log('Auth middleware - Authorization header:', req.header('Authorization'));
        
        // Token'ı header'dan al
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('Auth middleware - No token found in header');
            return res.status(401).json({ 
                success: false,
                error: 'Yetkilendirme token\'ı bulunamadı' 
            });
        }

        // Token'ı doğrula
        try {
            console.log('Auth middleware - Attempting to verify token:', token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Auth middleware - Token decoded successfully:', decoded);
            
            // Kullanıcıyı bul
            const user = await User.findById(decoded.userId);
            console.log('Auth middleware - User found:', user ? 'Yes' : 'No');
            
            if (!user) {
                console.log('Auth middleware - User not found for ID:', decoded.userId);
                return res.status(401).json({ 
                    success: false,
                    error: 'Kullanıcı bulunamadı' 
                });
            }

            // Kullanıcı ID'sini request'e ekle
            req.user = {
                userId: user._id,
                email: user.email,
                username: user.username
            };
            console.log('Auth middleware - Request user set:', req.user);
            next();
        } catch (jwtError) {
            console.error('Auth middleware - JWT verification error:', {
                name: jwtError.name,
                message: jwtError.message,
                stack: jwtError.stack
            });
            res.status(401).json({ 
                success: false,
                error: 'Geçersiz token',
                details: jwtError.message
            });
        }
    } catch (error) {
        console.error('Auth middleware - General error:', error);
        res.status(401).json({ 
            success: false,
            error: 'Lütfen giriş yapın',
            details: error.message
        });
    }
}; 