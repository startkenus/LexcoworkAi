# 🚪 Development Port Information

## Current Port: **3002**

Your dev server is running on **http://localhost:3002** (not 3000!)

### Why Port 3002?

Ports 3000 and 3001 were already in use by other applications.

### Access Your App:

- **Landing Page:** http://localhost:3002
- **Login:** http://localhost:3002/login  
- **Dashboard:** http://localhost:3002/dashboard

### To Change Port:

Edit `package.json`:
```json
"scripts": {
  "dev": "next dev -p 3000"
}
```

Then restart:
```bash
# Kill all node processes first
taskkill /F /IM node.exe

# Start on your preferred port
pnpm dev
```

### Check What's Using Port 3000:

```powershell
# Windows
netstat -ano | findstr :3000

# Find the PID and kill it
taskkill /PID <pid> /F
```

---

## 🔧 Quick Access Links

When dev server is running on port 3002:

- Landing Page: http://localhost:3002
- Login: http://localhost:3002/login
- Dashboard: http://localhost:3002/dashboard
- Admin: http://localhost:3002/admin

---

**Remember:** Always use port **3002** for local development!
