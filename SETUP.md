# מדריך הקמה — מערכת הזמנות מסעדה

## מה יש כאן?

מערכת הזמנות שולחנות מלאה למסעדה אחת:
- **דף הזמנה ציבורי** — לקוחות מזמינים שולחן
- **פאנל ניהול** — דשבורד, הזמנות, לקוחות, רשימת המתנה, הגדרות
- **מניעת אוברבוקינג** — חישוב אוטומטי של קיבולת
- **רשימת המתנה** — המרה להזמנה בלחיצה

---

## שלב 1 — Supabase (בסיס נתונים)

1. היכנס ל-**supabase.com** וצור חשבון חינמי
2. לחץ **"New project"**
3. בחר שם לפרויקט וסיסמה → **Create new project**
4. המתן ~2 דקות עד שהפרויקט מוכן

### הגדרת בסיס הנתונים:
5. לך ל-**SQL Editor** (בתפריט השמאלי)
6. לחץ **"New query"**
7. פתח את הקובץ `supabase-schema.sql` מהפרויקט
8. העתק את כל התוכן → הדבק → לחץ **Run**

### יצירת משתמש ראשון (מנהל):
9. לך ל-**Authentication → Users**
10. לחץ **"Add user"** → מלא אימייל וסיסמה
11. לאחר יצירה, לך ל-**SQL Editor** והרץ:

```sql
INSERT INTO staff (id, name, role)
VALUES (
  '<ה-UUID של המשתמש שיצרת>',
  'שם המנהל',
  'admin'
);
```

### העתקת המפתחות:
12. לך ל-**Settings → API**
13. העתק:
    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
    - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## שלב 2 — התקנת הפרויקט

```bash
# פתח את התיקייה
cd restaurant-app

# התקן תלויות
npm install

# צור קובץ הגדרות
cp .env.local.example .env.local
```

פתח `.env.local` ומלא את המפתחות מ-Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_RESTAURANT_NAME="שם המסעדה שלך"
```

---

## שלב 3 — הרצה מקומית

```bash
npm run dev
```

פתח בדפדפן:
- **הזמנה:** http://localhost:3000
- **ניהול:** http://localhost:3000/admin/dashboard

---

## שלב 4 — פריסה ל-Vercel (אינטרנט)

1. עלה את הפרויקט ל-GitHub
2. היכנס ל-**vercel.com**
3. **"New Project"** → בחר את ה-repo מ-GitHub
4. הוסף את משתני הסביבה (אותם 4 מ-.env.local)
5. לחץ **Deploy**

הפרויקט יהיה זמין תוך ~2 דקות בכתובת `yourname.vercel.app`

---

## מבנה הדפים

| כתובת | תיאור |
|--------|-------|
| `/` | מפנה אוטומטית לדף ההזמנה |
| `/reserve` | טופס הזמנה ציבורי ללקוחות |
| `/reserve/confirm` | אישור הזמנה / הודעת רשימת המתנה |
| `/admin/login` | כניסה לממשק ניהול |
| `/admin/dashboard` | דשבורד עם סטטיסטיקות היום |
| `/admin/reservations` | ניהול הזמנות עם סינון |
| `/admin/waiting-list` | רשימת המתנה + המרה |
| `/admin/customers` | מאגר לקוחות + חיפוש |
| `/admin/settings` | שעות, קיבולת, שם המסעדה |
