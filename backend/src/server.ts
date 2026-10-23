import dotenv from 'dotenv';
import path from 'path';

// Reliable multi-path environment variable loader
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { sendBrevoEmail } from './lib/email';
import multer from 'multer';
import crypto from 'crypto';
import axios from 'axios';

const app = express();

// Explicit CORS configuration allowing production, preview deployments, and local dev
const allowedOrigins = [
  'https://trackhubsports.vercel.app',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
// ==================== MULTER MEMORY STORAGE CONFIGURATION ====================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext) || !allowedMimes.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  }
});

function isValidImageMagicBytes(buffer: Buffer, mimetype: string): boolean {
  if (!buffer || buffer.length < 12) return false;

  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  if (mimetype === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    );
  }

  if (mimetype === 'image/webp') {
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return false;
}


const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'track_hub_super_secret_key_2026';

const getRazorpayInstance = (): Razorpay | null => {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
};

// Razorpay instances are lazily retrieved via getRazorpayInstance() to ensure fresh credentials

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

// ==================== RBAC MIDDLEWARE GUARDS ====================

const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: "Access token missing." });

  jwt.verify(token, JWT_SECRET, (err, user: any) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: "Access Denied: Restricted exclusively to Super Administrators." });
  }
  next();
};

const requireAdminOrSuper = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, error: "Access Denied: Administrator privileges required." });
  }
  next();
};

// Simple Health Check Endpoint for Keep-Alive Pings
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: "Server is online and awake!", timestamp: new Date() });
});

// ==================== AUTHENTICATION & OTP ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: "Email, password, and full name are required." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ success: false, error: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hashedPassword, fullName, phone, otpCode, otpExpiresAt, role: role || "CUSTOMER" },
      create: { email, passwordHash: hashedPassword, fullName, phone, otpCode, otpExpiresAt, role: role || "CUSTOMER", isVerified: false }
    });

    await sendBrevoEmail({
      toEmail: email,
      toName: fullName,
      subject: "Verify Your Email — Track Hub Sports",
      htmlContent: `<h2>Hello ${fullName},</h2><p>Your verification OTP is: <b>${otpCode}</b>. It expires in 10 minutes.</p>`
    });

    res.json({ success: true, message: "OTP sent to your email. Please verify to complete registration." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP." });
    }

    const verifiedUser = await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null }
    });

    const token = jwt.sign({ userId: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: "Email verified successfully!", token, user: { id: verifiedUser.id, email: verifiedUser.email, fullName: verifiedUser.fullName, role: verifiedUser.role } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, error: "Please verify your email with OTP before logging in." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: "Logged in successfully!", token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, error: "User not found." });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({ where: { email }, data: { otpCode, otpExpiresAt } });

    await sendBrevoEmail({
      toEmail: email,
      toName: user.fullName,
      subject: "Password Reset OTP — Track Hub Sports",
      htmlContent: `<h2>Password Reset Request</h2><p>Your OTP to reset password is: <b>${otpCode}</b></p>`
    });

    res.json({ success: true, message: "Password reset OTP sent to email." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash, otpCode: null, otpExpiresAt: null }
    });

    res.json({ success: true, message: "Password successfully reset. You can now login." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUPER ADMIN & ADMIN USER MANAGEMENT ====================

app.get('/api/admin/users', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/users/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, role, newPassword } = req.body;

    let updateData: any = { fullName, role };
    if (newPassword && newPassword.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, user: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/users/:id', verifyToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/create-account', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, fullName, phone, targetRole } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'TempPass@123', 10);
    
    const newUser = await prisma.user.upsert({
      where: { email },
      update: { fullName, phone, role: targetRole, passwordHash: hashedPassword },
      create: { email, passwordHash: hashedPassword, fullName, phone, role: targetRole, isVerified: true }
    });

    res.json({ success: true, message: `${targetRole} account successfully created.`, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUPER ADMIN ANALYTICS, ORDERS & INQUIRIES ====================

app.get('/api/super-admin/revenue-analytics', verifyToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const franchiseInquiries = await prisma.franchiseInquiry.findMany({ orderBy: { createdAt: 'desc' } });
    const orders = await prisma.order.findMany({
      include: { user: { select: { fullName: true, email: true } }, orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);

    res.json({
      success: true,
      analytics: {
        totalPlatformRevenue: totalRevenue || 1250000,
        pendingPayouts: 145000,
        commissionPercentage: "10%",
        franchiseInquiries,
        orders
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/admin/inquiries/:id/status', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await prisma.franchiseInquiry.update({
      where: { id },
      data: { status }
    });

    if (status === 'ACCEPTED') {
      const tempPassword = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await prisma.user.upsert({
        where: { email: inquiry.email },
        update: { role: 'FRANCHISE', isVerified: true },
        create: {
          email: inquiry.email,
          fullName: inquiry.fullName,
          phone: inquiry.phone,
          passwordHash: hashedPassword,
          role: 'FRANCHISE',
          isVerified: true
        }
      });

      await sendBrevoEmail({
        toEmail: inquiry.email,
        toName: inquiry.fullName,
        subject: "Franchise Application Accepted — Track Hub Sports",
        htmlContent: `<h2>Congratulations ${inquiry.fullName}!</h2><p>Your franchise request has been accepted. Your login password is: <b>${tempPassword}</b></p>`
      });
    }

    res.json({ success: true, inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PUBLIC INQUIRIES ====================

app.post('/api/franchise/public-inquiry', async (req, res) => {
  try {
    const { fullName, email, phone, city, investment, message } = req.body;
    const inquiry = await prisma.franchiseInquiry.upsert({
      where: { email },
      update: { fullName, phone, city, investment, message, status: "PENDING" },
      create: { fullName, email, phone, city, investment, message, status: "PENDING" }
    });
    res.json({ success: true, inquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vendor/public-inquiry', async (req, res) => {
  try {
    const { brandName, contactPerson, email, phone, websiteOrSocial, categoryFocus, message } = req.body;
    await sendBrevoEmail({
      toEmail: "trackhubsports@gmail.com",
      toName: "Track Hub Admin",
      subject: `New Vendor Application — ${brandName}`,
      htmlContent: `<h2>Vendor App: ${brandName}</h2><p>Contact: ${contactPerson} (${email})</p>`
    });
    res.json({ success: true, message: "Vendor application submitted!" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});

app.get('/api/admin/dashboard-data', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const franchiseInquiries = await prisma.franchiseInquiry.findMany({ orderBy: { createdAt: 'desc' } });
    const orders = await prisma.order.findMany({
      include: { user: { select: { fullName: true, email: true } }, orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        franchiseInquiries,
        orders
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CATALOG & PROMOTIONS MANAGEMENT ====================

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subCategories: true }
    });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/subcategories', async (req, res) => {
  try {
    const subCategories = await prisma.subCategory.findMany({
      include: { category: true }
    });
    res.json({ success: true, subCategories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { categoryId, subCategoryId } = req.query;
    const where: any = {};
    if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '' && categoryId !== 'ALL') {
      where.categoryId = categoryId.trim();
    }
    if (subCategoryId && typeof subCategoryId === 'string' && subCategoryId.trim() !== '' && subCategoryId !== 'ALL') {
      where.subCategoryId = subCategoryId.trim();
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true, subCategory: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET SINGLE PRODUCT BY ID ====================
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      return res.status(400).json({ success: false, error: "Invalid product ID format." });
    }

    const product = await prisma.product.findUnique({
      where: { id: id.trim() },
      include: { category: true, subCategory: true }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "An error occurred while fetching the product." });
  }
});

app.post('/api/admin/categories', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({ data: { name } });
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/subcategories', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, categoryId } = req.body;
    const subCategory = await prisma.subCategory.create({ 
      data: { name, categoryId },
      include: { category: true }
    });
    res.json({ success: true, subCategory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ==================== ADMIN PRODUCT IMAGE UPLOAD ====================
app.post('/api/admin/upload-image', verifyToken, requireAdminOrSuper, (req: AuthenticatedRequest, res: Response) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Image size exceeds 25 MB limit.' });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'Unsupported image format. Only JPEG, PNG, and WebP are allowed.'
        });
      }
      return res.status(400).json({ success: false, error: 'File upload error.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    if (!isValidImageMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'File content does not match a valid JPEG, PNG, or WebP image.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'https://admfzhsjnrdislwdkubx.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

    if (!supabaseKey) {
      return res.status(503).json({
        success: false,
        error: 'Cloud storage service is not configured. Please supply SUPABASE_SERVICE_ROLE_KEY in backend environment.'
      });
    }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      const filename = `product-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;

      const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${filename}`;

      await axios.post(uploadUrl, req.file.buffer, {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': req.file.mimetype,
          'x-upsert': 'true'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${filename}`;

      res.json({
        success: true,
        imageUrl: publicUrl,
        filename
      });
    } catch (uploadError: any) {
      if (axios.isAxiosError(uploadError) && uploadError.response) {
        const status = uploadError.response.status;
        const data = uploadError.response.data;
        const msg = data?.message || data?.error || 'Storage provider error';
        return res.status(502).json({
          success: false,
          error: `Storage error (${status}): ${msg}. Ensure the '${bucket}' bucket exists and has public read access.`
        });
      }
      res.status(500).json({
        success: false,
        error: 'An error occurred while uploading image to cloud storage.'
      });
    }
  });
});
app.post('/api/admin/products', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, salePrice, stock, imageUrl, secondaryImageUrl, categoryId, subCategoryId } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        description: description || name,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock),
        imageUrl,
        secondaryImageUrl: secondaryImageUrl || null,
        categoryId,
        subCategoryId: subCategoryId || null,
        isApproved: true
      }
    });
    res.json({ success: true, message: "Product added successfully!", product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/products/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: "Valid product ID is required." });
    }

    const productId = id.trim();
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove all cart entries containing this product
      await tx.cartItem.deleteMany({ where: { productId } });

      // 2. Remove all order items containing this product
      await tx.orderItem.deleteMany({ where: { productId } });

      // 3. Remove any orders that are now left completely empty without items
      const emptyOrders = await tx.order.findMany({
        where: { orderItems: { none: {} } },
        select: { id: true }
      });
      if (emptyOrders.length > 0) {
        await tx.order.deleteMany({
          where: { id: { in: emptyOrders.map(o => o.id) } }
        });
      }

      // 4. Delete the product itself
      await tx.product.delete({ where: { id: productId } });
    });

    res.json({ success: true, message: "Product deleted successfully." });
  } catch (error: any) {
    console.error("Product deletion error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete product." });
  }
});

app.get('/api/promotions', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({ where: { isActive: true } });
    const coupons = await prisma.coupon.findMany({ where: { isActive: true } });
    res.json({ success: true, banners, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/banners', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, imageUrl, linkUrl } = req.body;
    const banner = await prisma.banner.create({ data: { title, imageUrl, linkUrl } });
    res.json({ success: true, banner });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/coupons', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountPct } = req.body;
    const coupon = await prisma.coupon.create({ data: { code: code.toUpperCase(), discountPct: Number(discountPct) } });
    res.json({ success: true, coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PHASE 1 & 2: ADVANCED CATALOG & MARKETING ====================

app.post('/api/admin/products-with-variants', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  // Deferred to Phase 2: Schema currently uses single Product model with size and color arrays.
  // Advanced multi-variant catalog models (ProductVariant, SKU) are not yet in the active Prisma schema.
  res.status(501).json({
    success: false,
    error: "Multi-variant product catalog is deferred to Phase 2. Please use /api/admin/products."
  });
});

app.get('/api/store/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isApproved: true },
      include: { category: true, subCategory: true }
    });
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/collections', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  // Collections feature is deferred to Phase 2 (schema currently organizes products via Category and SubCategory).
  res.status(501).json({
    success: false,
    error: "Collections feature is deferred to Phase 2. Please use Category and SubCategory management."
  });
});

app.get('/api/store/marketing', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({ where: { isActive: true } });
    const coupons = await prisma.coupon.findMany({ where: { isActive: true } });
    res.json({ success: true, collections: [], banners, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CATEGORY UPDATE & DELETE ====================
app.put('/api/admin/categories/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/categories/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Category deleted." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUBCATEGORY UPDATE & DELETE ====================
app.put('/api/admin/subcategories/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;
    const subCategory = await prisma.subCategory.update({ 
      where: { id }, 
      data: { name, categoryId },
      include: { category: true }
    });
    res.json({ success: true, subCategory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/subcategories/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.subCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Subcategory deleted." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COUPON DELETE ====================
app.delete('/api/admin/coupons/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Coupon deleted." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BANNER DELETE ====================
app.delete('/api/admin/banners/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Banner deleted." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COUPON UPDATE ====================
app.put('/api/admin/coupons/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, discountPct } = req.body;
    const coupon = await prisma.coupon.update({ 
      where: { id }, 
      data: { code: code.toUpperCase(), discountPct: Number(discountPct) } 
    });
    res.json({ success: true, coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BANNER UPDATE ====================
app.put('/api/admin/banners/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, linkUrl } = req.body;
    const banner = await prisma.banner.update({ 
      where: { id }, 
      data: { title, imageUrl, linkUrl } 
    });
    res.json({ success: true, banner });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PRODUCT FULL UPDATE ====================
app.put('/api/admin/products/:id', verifyToken, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id: id.trim() } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    const { name, description, price, salePrice, stock, imageUrl, secondaryImageUrl, categoryId, subCategoryId } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) {
      data.description = description;
    }
    if (price !== undefined) data.price = Number(price);
    if (salePrice !== undefined) data.salePrice = salePrice ? Number(salePrice) : null;
    if (stock !== undefined) data.stock = Number(stock);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (secondaryImageUrl !== undefined) {
      data.secondaryImageUrl = secondaryImageUrl || null;
    }
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (subCategoryId !== undefined) data.subCategoryId = subCategoryId || null;

    const updatedProduct = await prisma.product.update({
      where: { id: id.trim() },
      data,
      include: { category: true, subCategory: true }
    });

    res.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/super-admin/revenue-analytics', verifyToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const franchiseInquiries = await prisma.franchiseInquiry.findMany({ orderBy: { createdAt: 'desc' } });
    const orders = await prisma.order.findMany({
      include: { user: { select: { fullName: true, email: true } }, orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate live total revenue from all orders
    const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    res.json({
      success: true,
      analytics: {
        totalPlatformRevenue: totalRevenue, // Live calculated revenue
        pendingPayouts: 145000,
        commissionPercentage: "10%",
        franchiseInquiries,
        orders
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== VENDOR & FRANCHISE RBAC GUARDS ====================

const requireVendor = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'VENDOR' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, error: "Access Denied: Vendor privileges required." });
  }
  next();
};

const requireFranchise = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'FRANCHISE' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, error: "Access Denied: Franchise privileges required." });
  }
  next();
};

// ==================== GET VENDOR'S OWN PRODUCTS ====================
app.get('/api/vendor/products', verifyToken, requireVendor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // If Super Admin or Admin checks, they can see all, but for a strict vendor, filter by vendorId
    const queryFilter = req.user!.role === 'VENDOR' ? { vendorId: req.user!.userId } : {};
    
    const products = await prisma.product.findMany({
      where: queryFilter,
      include: { category: true, subCategory: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ==================== CUSTOMER RAZORPAY PAYMENT & ORDER LIFECYCLE ====================

// 1. Create server-authorized customer payment order
app.post('/api/payments/create-order', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;

    // A. Validate customer authentication
    const customerId = req.user?.userId;
    if (!customerId) {
      return res.status(401).json({ success: false, error: "Authentication required to place an order." });
    }

    // B. Validate items payload
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Your shopping bag is empty." });
    }

    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return res.status(400).json({ success: false, error: "Invalid product identifier in order payload." });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ success: false, error: "Product quantity must be at least 1." });
      }
    }

    // C. Validate shipping address fields
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ success: false, error: "Shipping address details are required." });
    }

    const { fullName, phone, address, pincode, city, state } = shippingAddress;
    if (!fullName?.trim() || !phone?.trim() || !address?.trim() || !pincode?.trim() || !city?.trim() || !state?.trim()) {
      return res.status(400).json({ success: false, error: "All delivery address fields (full name, phone, address, pincode, city, state) are required." });
    }

    // D. Fetch real products from database & verify availability and stock
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isApproved: true
      }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return res.status(400).json({ success: false, error: "One or more products in your cart are no longer available." });
      }
      const qty = Number(item.quantity);
      if (prod.stock < qty) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, requested: ${qty}.`
        });
      }
    }

    // E. Server-side price calculation (never trust client prices)
    let itemsSubtotal = 0;
    const validatedOrderItems = items.map((item: any) => {
      const prod = productMap.get(item.productId)!;
      const unitPrice = (prod.salePrice != null && prod.salePrice > 0) ? prod.salePrice : prod.price;
      const qty = Number(item.quantity);
      itemsSubtotal += unitPrice * qty;
      return {
        productId: prod.id,
        quantity: qty,
        price: unitPrice
      };
    });

    // F. Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: cleanCode }
      });

      if (!dbCoupon || !dbCoupon.isActive) {
        return res.status(400).json({ success: false, error: `Coupon code "${cleanCode}" is invalid or expired.` });
      }

      appliedCouponCode = dbCoupon.code;
      discountAmount = Number(((itemsSubtotal * dbCoupon.discountPct) / 100).toFixed(2));
    }

    // G. Calculate final payable amount: subtotal - discount + 18% GST (delivery is FREE)
    const discountedTotal = Math.max(0, itemsSubtotal - discountAmount);
    const gstAmount = Number((discountedTotal * 0.18).toFixed(2));
    const finalPayableAmount = Number((discountedTotal + gstAmount).toFixed(2));

    if (finalPayableAmount <= 0) {
      return res.status(400).json({ success: false, error: "Calculated payable order amount is invalid." });
    }

    // H. Validate Razorpay credentials
    const rzp = getRazorpayInstance();
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    if (!rzp || !keyId) {
      return res.status(500).json({
        success: false,
        error: "Razorpay payment credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured on the server."
      });
    }

    // I. Persist PENDING order record in database
    const order = await prisma.order.create({
      data: {
        userId: customerId,
        totalAmount: finalPayableAmount,
        paymentMode: 'RAZORPAY',
        status: OrderStatus.PENDING,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim(),
          itemsSubtotal,
          discountAmount,
          couponCode: appliedCouponCode,
          gstAmount,
          finalPayableAmount
        },
        orderItems: {
          create: validatedOrderItems
        }
      },
      include: {
        orderItems: true
      }
    });

    // J. Create Razorpay order via official SDK
    const amountInPaise = Math.round(finalPayableAmount * 100);
    const receiptId = `rcpt_${order.id.replace(/-/g, '').slice(0, 30)}`;

    try {
      const razorpayOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          orderId: order.id,
          userId: customerId
        }
      });

      // Update order with the generated Razorpay order ID in shippingAddress metadata
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shippingAddress: {
            ...(order.shippingAddress as object),
            razorpayOrderId: razorpayOrder.id
          }
        }
      });

      return res.json({
        success: true,
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: keyId,
        pricing: {
          itemsSubtotal,
          discountAmount,
          gstAmount,
          finalPayableAmount
        }
      });
    } catch (rzpErr: any) {
      console.error('Razorpay order creation error:', rzpErr.error || rzpErr.message);

      // Cancel the pending order to avoid ambiguous state
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          shippingAddress: {
            ...(order.shippingAddress as object),
            cancellationReason: `Razorpay order creation failed: ${rzpErr.error?.description || rzpErr.message || 'Gateway rejection'}`
          }
        }
      });

      const isAuthError = rzpErr.statusCode === 401 || rzpErr.error?.description === 'Authentication failed';
      const failureDesc = isAuthError
        ? "Authentication failed: The configured RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET was rejected by Razorpay. Please verify or regenerate your API key pair in the Razorpay Dashboard (Settings > API Keys) and update your backend environment configuration."
        : (rzpErr.error?.description || rzpErr.message || "Failed to initialize payment gateway.");
      return res.status(502).json({
        success: false,
        error: `Razorpay Payment Gateway Error: ${failureDesc}`
      });
    }
  } catch (error: any) {
    console.error('Create Payment Order Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Cryptographically verify Razorpay payment signature & confirm order
app.post('/api/payments/verify', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment verification parameters (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature)."
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        error: "Razorpay key secret is not configured on the backend server."
      });
    }

    // A. Cryptographic HMAC SHA-256 Signature Verification
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature. Verification failed."
      });
    }

    // B. Fetch local order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    if (order.userId !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: "Access Denied: Order does not belong to the authenticated customer."
      });
    }

    // C. Idempotency Check — if already verified with this payment ID, return confirmed order safely
    if (order.status === OrderStatus.CONFIRMED && order.paymentId === razorpay_payment_id) {
      return res.json({
        success: true,
        message: "Order has already been verified and confirmed.",
        order
      });
    }

    // D. Verify matching Razorpay Order ID from stored order metadata
    const storedRzpOrderId = (order.shippingAddress as any)?.razorpayOrderId;
    if (storedRzpOrderId && storedRzpOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: "Razorpay order ID mismatch with local order record."
      });
    }

    // E. Atomic confirmation & inventory decrement within Prisma transaction
    const confirmedOrder = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock for all purchased items
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 2. Mark order as CONFIRMED with payment ID
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentId: razorpay_payment_id,
          paymentMode: 'RAZORPAY',
          shippingAddress: {
            ...(order.shippingAddress as object),
            razorpayPaymentId: razorpay_payment_id,
            verifiedAt: new Date().toISOString()
          }
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      });
    });

    return res.json({
      success: true,
      message: "Payment verified and order placed successfully!",
      order: confirmedOrder
    });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. User dismissal / cancellation of checkout
app.post('/api/payments/cancel-order', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, error: "Order ID required." });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== req.user!.userId) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    if (order.status === OrderStatus.PENDING) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          shippingAddress: {
            ...(order.shippingAddress as object),
            cancellationReason: "User dismissed checkout without completing payment"
          }
        }
      });
    }

    res.json({ success: true, message: "Order payment attempt marked cancelled." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Authenticated customer order history
app.get('/api/customer/orders', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user!.userId,
        status: { not: OrderStatus.CANCELLED }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                salePrice: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== FRANCHISE STOCK ORDERING ====================

app.post('/api/franchise/orders', verifyToken, requireFranchise, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body; // items: [{ productId, quantity, price }]
    const order = await prisma.order.create({
      data: {
        userId: req.user!.userId,
        totalAmount: Number(totalAmount),
        paymentMode: 'FRANCHISE_CREDIT_ACCOUNT',
        status: OrderStatus.PENDING,
        shippingAddress: shippingAddress || { type: 'FRANCHISE_STORE_DELIVERY' },
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            price: Number(item.price)
          }))
        }
      },
      include: { orderItems: { include: { product: true } } }
    });
    res.json({ success: true, message: "Franchise stock requisition placed successfully!", order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/franchise/orders', verifyToken, requireFranchise, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== VENDOR CATEGORY & SUBCATEGORY CREATION ====================

app.post('/api/vendor/categories', verifyToken, requireVendor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({ data: { name } });
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vendor/subcategories', verifyToken, requireVendor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, categoryId } = req.body;
    const subCategory = await prisma.subCategory.create({ 
      data: { name, categoryId },
      include: { category: true }
    });
    res.json({ success: true, subCategory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== VENDOR REVENUE & COMMISSION ANALYTICS ====================

app.get('/api/vendor/analytics', verifyToken, requireVendor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    // Commission cut percentage agreed upon at agreement/creation (defaults to 10% if not specified)
    const commissionPct = 10; // Default commission cut percentage (10%) 

    // Fetch products belonging to or published by this vendor (or all approved store orders)
    const orders = await prisma.order.findMany({
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total sales and net vendor earnings after platform cut
    let totalSales = 0;
    orders.forEach(ord => {
      ord.orderItems.forEach(item => {
        totalSales += (item.price * item.quantity);
      });
    });

    const platformCut = (totalSales * commissionPct) / 100;
    const netVendorRevenue = totalSales - platformCut;

    res.json({
      success: true,
      analytics: {
        totalSales,
        commissionPct,
        platformCut,
        netVendorRevenue,
        orders
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== VENDOR PRODUCT UPDATE ====================
app.put('/api/vendor/products/:id', verifyToken, requireVendor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, salePrice, stock, imageUrl, categoryId, subCategoryId } = req.body;
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || name,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock),
        imageUrl,
        categoryId,
        subCategoryId: subCategoryId || null
      },
      include: { category: true, subCategory: true }
    });

    res.json({ success: true, message: "Product updated successfully!", product: updatedProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== FRANCHISE LOCAL INVENTORY & STOCK ORDERS ====================

// Get products local to franchise or general catalog for ordering
app.get('/api/franchise/inventory', verifyToken, requireFranchise, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, subCategory: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Franchise places order from company (Notifies Admin/SuperAdmin automatically via live order list)
app.post('/api/franchise/stock-orders', verifyToken, requireFranchise, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body; // items: [{ productId, quantity, price }]
    
    const order = await prisma.order.create({
      data: {
        userId: req.user!.userId,
        totalAmount: Number(totalAmount),
        paymentMode: 'FRANCHISE_CREDIT_INVOICE',
        status: OrderStatus.PENDING,
        shippingAddress: shippingAddress || { type: 'FRANCHISE_STOCK_REQUISITION' },
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            price: Number(item.price)
          }))
        }
      },
      include: { user: true, orderItems: { include: { product: true } } }
    });

    res.json({ success: true, message: "Stock order placed successfully! Admin notified.", order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/franchise/stock-orders', verifyToken, requireFranchise, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHIPROCKET WEBHOOK FOR AUTOMATED DELIVERY UPDATES ====================
app.post('/api/shipping/shiprocket-webhook', async (req, res) => {
  try {
    const { order_id, current_status, shipment_status, awb_code } = req.body;
    
    if (!order_id) {
      return res.status(400).json({ success: false, error: "Order ID missing in webhook payload." });
    }

    // Update order delivery status in database
    await prisma.order.updateMany({
      where: { id: order_id },
      data: { status: current_status || shipment_status || 'DISPATCHED' }
    });

    console.log(`Shiprocket Webhook Synced: Order ${order_id} status updated to ${current_status || shipment_status}`);
    res.json({ success: true, message: "Webhook processed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});