const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

### `.env`
```
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=thynk_jwt_secret_2026
JWT_REFRESH_SECRET=thynk_refresh_secret_2026
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

---

### `.gitignore`
```
node_modules/
.env
