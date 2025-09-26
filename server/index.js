@@ .. @@
 const express = require('express');
 const cors = require('cors');
 const rateLimit = require('express-rate-limit');
+const morgan = require('morgan');
 const { setupAuth } = require('./auth.ts');
 
 const app = express();
 const PORT = process.env.PORT || 8000;
 
+// Add request logging
+app.use(morgan('combined'));
+
 // CORS configuration
 const corsOptions = {
   origin: [
     'http://localhost:5000',
     'http://127.0.0.1:5000',
     'http://localhost:8081',
+    'http://127.0.0.1:8081',
     // Add your production domains here
   ],
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
 };
 
 app.use(cors(corsOptions));
