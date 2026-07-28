# 🚀 QUICK START - RUN YOUR PROJECT NOW

## Step 1: Open 2 Terminal Windows

You need TWO separate terminal windows/tabs for backend and frontend.

---

## Step 2: Start Backend Server

**In Terminal 1:**
```bash
cd "d:/Full Stack Development/Ai Job Matcher Project/server"
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
📊 API endpoint: http://localhost:5000/api/analyze
🔐 Auth endpoint: http://localhost:5000/api/auth
```

✅ **Backend is ready when you see "Server running"**

---

## Step 3: Start Frontend Server

**In Terminal 2:**
```bash
cd "d:/Full Stack Development/Ai Job Matcher Project/client"
npm run dev
```

**Expected output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ **Frontend is ready when you see "Local: http://localhost:5173"**

---

## Step 4: Open Your App

Go to your browser and open:
```
http://localhost:5173
```

You should see the **Landing Page** with all features! 🎉

---

## 🎯 Test All Features

### 1. AI Chat 🤖
- Look for **floating chat button** in bottom-right corner
- Click it and ask: *"What should I put in my resume?"*
- AI responds with helpful tips ✅

### 2. Interview Prep 🎤
- Click **Login** or **Register**
- Go to **Dashboard**
- Click **"🎤 Interview Prep"** tab
- Paste job description + resume
- Click **"✨ Generate Interview Questions"**
- Practice your answers
- Get AI feedback with scores ✅

### 3. Real Jobs 💼
- In Dashboard, click **"💼 Find Jobs"** tab
- Search: *"Python Developer"*
- Select location: *"Maharashtra"*
- See real jobs from RemoteOK ✅

---

## 📱 Key Pages to Visit

| Page | URL | Purpose |
|------|-----|---------|
| Landing | http://localhost:5173 | Home page with features |
| Register | http://localhost:5173/register | Create account |
| Login | http://localhost:5173/login | Sign in |
| Dashboard | http://localhost:5173/dashboard | Main app hub |
| Interview Prep | http://localhost:5173/interview | Practice interviews |

---

## ⚙️ Configuration (Optional but Recommended)

To get MORE JOBS from Adzuna, add API keys:

1. Go to: https://developer.adzuna.com/
2. Sign up (free account)
3. Get: **App ID** and **API Key**
4. Open `server/.env` and add:
   ```
   ADZUNA_APP_ID=your_app_id_here
   ADZUNA_API_KEY=your_api_key_here
   ```
5. Restart backend server (Ctrl+C then `npm run dev`)

---

## 🆘 Troubleshooting

### Backend won't start?
```bash
# Make sure you're in the server folder
cd server
npm install  # Install dependencies if needed
npm run dev
```

### Frontend won't start?
```bash
# Make sure you're in the client folder
cd client
npm install  # Install dependencies if needed
npm run dev
```

### Port already in use?
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Then restart
npm run dev
```

### Chat or Interview not working?
- Check that both servers are running
- Clear browser cache (Ctrl+Shift+Delete)
- Restart frontend: press `Ctrl+C` in terminal, then `npm run dev`

### Interview questions not generating?
- Make sure `GROQ_API_KEY` is set in `server/.env`
- Get free key from: https://console.groq.com/

---

## ✅ Success Checklist

- [ ] Backend server running (Terminal 1)
- [ ] Frontend server running (Terminal 2)
- [ ] App opens at http://localhost:5173
- [ ] Landing page displays correctly
- [ ] AI Chat button visible (bottom-right)
- [ ] Can navigate to Dashboard
- [ ] Interview Prep tab visible
- [ ] Real Jobs search works

---

## 🎉 YOU'RE LIVE!

Your AI Job Matcher is now running with:
- ✅ AI Chat Agent
- ✅ Interview Prep Mode
- ✅ Real Jobs Integration
- ✅ Professional UI
- ✅ Mobile Responsive Design

**Enjoy your application!** 🚀

For detailed documentation, see: `IMPLEMENTATION_GUIDE.md`
