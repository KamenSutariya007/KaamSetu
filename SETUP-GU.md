# KaamSetu — Bija PC par Setup (Transfer Guide)

Project **koi pan PC / drive** par chale — Firebase cloud par che, etle navi PC par pan same project use thay.

---

## Option A: Zip thi transfer (recommended)

### Purani PC par
```powershell
cd F:\KaamSetu
.\scripts\pack-for-transfer.ps1
```
`KaamSetu-transfer.zip` banse (node_modules / venv vagar — chhota file).

**Jaruri files USB ma copy karo** (zip ma pan hoy, verify karo):
| File | Kyu |
|------|-----|
| `.env` | Backend config |
| `frontend\.env` | Firebase config |
| `backend\firebase-service-account.json` | Firebase secret key |

### Navi PC par
1. **Python 3.11+** install: https://python.org  
2. **Node.js 20+** install: https://nodejs.org  
3. Zip extract karo (e.g. `D:\KaamSetu` ke `C:\Projects\KaamSetu`)  
4. Upar ni 3 secret files copy karo (jo zip ma na hoy)  
5. Setup:
```powershell
cd D:\KaamSetu
.\scripts\setup.ps1
```
6. Run:
```powershell
.\scripts\run-dev.ps1
```
7. Browser: **http://localhost:5173**

---

## Option B: Folder copy (USB / Google Drive)

**Copy karo:** saru `KaamSetu` folder  
**Copy NA karo** (vadhare time/space): `frontend\node_modules`, `backend\venv`

Navi PC par `.\scripts\setup.ps1` chalavo — packages auto install thase.

---

## Firebase — ek j project badha PC par

Firebase **cloud** par che. Navi PC par:
- Same `frontend\.env` values
- Same `backend\firebase-service-account.json`
- Firebase Console ma **Authentication → Email/Password** ON hoy to kaam kare

**Authorized domains** (Firebase Console): `localhost` add karo — ek vaar, badha PC par kaam kare.

---

## Path / drive letter

`.env` ma relative path use thay che:
```env
FIREBASE_CREDENTIALS_PATH=backend/firebase-service-account.json
```
Etale `F:\`, `D:\`, ke `C:\` — koi pan drive par chale.

---

## Quick commands

| Command | Shu kare |
|---------|----------|
| `.\scripts\setup.ps1` | Navi PC par ek vaar install + migrate |
| `.\scripts\run-dev.ps1` | Backend + Frontend start |
| `.\scripts\pack-for-transfer.ps1` | Transfer mate zip |

---

## Problem?

| Issue | Fix |
|-------|-----|
| `python` not found | Python install karo, PATH ma add karo |
| `npm` not found | Node.js install karo |
| Firebase register fail | `firebase-service-account.json` copy karo |
| Email verify fail | Firebase Console → Auth → Email ON |

---

## Requirements (navi PC)

- Windows 10/11
- Python 3.11+
- Node.js 20+
- Internet (Firebase + npm install mate)
