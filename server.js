const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer'); // لرفع الصور
const cloudinary = require('cloudinary').v2; // لتخزين الصور سحابياً

const app = express();
app.use(express.json({ limit: '50mb' })); // للسماح بالصور الكبيرة

// اطلب من السيرفر السماح بكل الروابط (أسهل حل الآن)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type']
}));

// الاتصال بقاعدة البيانات MongoDB
mongoose.connect('mongodb+srv://cinmaegypt_db_user:hamed@220194@cluster0.ilcsqff.mongodb.net/?appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// --- المخططات (Schemas) ---

// مخطط مقدمي الخدمة (أطباء، معامل، صيدليات)
const ProviderSchema = new mongoose.Schema({
    name: String,
    pass: String,
    spec: String,
    hours: String,
    img: String, // رابط الصورة على السحاب
    appointments: [{
        patientName: String,
        phone: String,
        address: String,
        orderImg: String,
        reports: [{
            date: { type: Date, default: Date.now },
            text: String,
            img: String
        }]
    }]
});

// مخطط الإعلانات
const AdSchema = new mongoose.Schema({
    type: { type: String, enum: ['text', 'image'] },
    content: String, // النص أو رابط الصورة
    title: String,
    createdAt: { type: Date, default: Date.now }
});

const Provider = mongoose.model('Provider', ProviderSchema);
const Ad = mongoose.model('Ad', AdSchema);

// --- المسارات (Routes) ---

// 1. جلب الإعلانات للرئيسية
app.get('/api/ads', async (req, res) => {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
});

// 2. إضافة إعلان جديد (أدمن)
app.post('/api/ads', async (req, res) => {
    const newAd = new Ad(req.body);
    await newAd.save();
    res.json({ message: "تم النشر بنجاح" });
});

// 3. حذف إعلان
app.delete('/api/ads/:id', async (req, res) => {
    await Ad.findByIdAndDelete(req.params.id);
    res.json({ message: "تم الحذف" });
});

// 4. إضافة مقدم خدمة
app.post('/api/providers', async (req, res) => {
    const provider = new Provider(req.body);
    await provider.save();
    res.json(provider);
});

// 5. حجز موعد / طلب تحليل / طلب دواء
app.post('/api/book/:providerId', async (req, res) => {
    const provider = await Provider.findById(req.params.providerId);
    provider.appointments.push(req.body);
    await provider.save();
    res.json({ message: "تم إرسال طلبك بنجاح" });
});

// 6. دخول الطبيب وجلب مرضاه
app.post('/api/login', async (req, res) => {
    const { name, pass } = req.body;
    const user = await Provider.findOne({ name, pass });
    if (user) res.json(user);
    else res.status(401).send("خطأ في البيانات");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));