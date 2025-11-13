# Sample Users & Demo Data Guide

After running the installation, your school management system comes pre-configured with sample data to help you get started quickly.

## 📋 Sample Users Created

### Administrator Account
- **Email:** Administrator
- **Password:** [From ~/project-passwords.txt]
- **Access:** Complete system access, use this for initial setup

### Principal
- **Email:** principal@school.local
- **Password:** principal123
- **Role:** Education Manager, System Manager
- **Access:** Full academic and administrative control

### Teachers (3 Sample)
1. **John Mathew** (Mathematics)
   - Email: teacher1@school.local
   - Password: teacher123
   
2. **Sarah Williams** (English)
   - Email: teacher2@school.local
   - Password: teacher123
   
3. **Raj Kumar** (Science)
   - Email: teacher3@school.local
   - Password: teacher123

**Teacher Access:** Can manage classes, assignments, attendance, and grades

### Accountant
- **Email:** accountant@school.local
- **Password:** accounts123
- **Role:** Accounts Manager
- **Access:** Fee collection, invoicing, financial reports

## 👨‍🎓 Sample Students (5)

1. **Rahul Sharma** - Class 5
   - Guardian: Mr. Rajesh Sharma
   - Email: rajesh.sharma@email.com

2. **Priya Singh** - Class 8
   - Guardian: Mrs. Sunita Singh
   - Email: sunita.singh@email.com

3. **Amit Patel** - Class 10
   - Guardian: Mr. Suresh Patel
   - Email: suresh.patel@email.com

4. **Neha Gupta** - Class 3
   - Guardian: Mr. Anil Gupta
   - Email: anil.gupta@email.com

5. **Arjun Reddy** - Class 7
   - Guardian: Mrs. Lakshmi Reddy
   - Email: lakshmi.reddy@email.com

## 💰 Fee Structures Pre-configured

### Tuition Fees (Based on St. Francis English School)
| Class | Monthly Fee |
|-------|-------------|
| Nursery | ₹550 |
| LKG | ₹550 |
| UKG | ₹600 |
| Class 1-2 | ₹650 |
| Class 3-4 | ₹700 |
| Class 5-6 | ₹750 |
| Class 7 | ₹800 |
| Class 8 | ₹900 |
| Class 9 | ₹1,000 |
| Class 10 | ₹1,100 |

### Transportation Routes (22 Routes)
| Route | Monthly Fee | Type |
|-------|-------------|------|
| Fatehpur, Paharpur, Raghopur | ₹450 | Local |
| Bhagtan, Chaksinpar, Malikpur | ₹500 | Local |
| Chandpura, Ibrahimabad, Rampur | ₹550 | Mid-range |
| Jurawanpur, Mohanpur areas | ₹600 | Mid-range |
| Rampur Shyamchand | ₹650 | Mid-range |
| Behrampur | ₹800 | Far |
| Shivnagar | ₹1,000 | Far |
| Rupas (Shivnagar) | ₹1,200 | Very Far |
| Rupas Mahaji | ₹1,500 | Very Far |

## 🚀 Quick Start Guide

### 1. First Login
```
URL: http://localhost:8080 (or your configured port)
Username: Administrator
Password: [from passwords file]
```

### 2. Try Different User Roles

**Test as Principal:**
- Login with principal@school.local / principal123
- View all students, programs, fee structures
- Manage academic calendar

**Test as Teacher:**
- Login with teacher1@school.local / teacher123
- View assigned students
- Mark attendance
- Enter grades

**Test as Accountant:**
- Login with accountant@school.local / accounts123
- Generate fee invoices for students
- Record payments
- View outstanding fees

### 3. Common Tasks to Try

**Enroll a New Student:**
1. Go to Education > Student
2. Create new student
3. Add guardian information
4. Enroll in program

**Generate Fee Invoice:**
1. Go to Education > Fees
2. Select Fee Structure
3. Generate fees for students
4. Process payment

**Mark Attendance:**
1. Go to Education > Attendance
2. Select class/program
3. Mark present/absent

**View Reports:**
1. Go to Reports
2. Check student-wise fees
3. View outstanding amounts
4. Class-wise statistics

## 🔐 Security Notes

### Change Default Passwords!
For production use, immediately change all sample passwords:

```bash
# Access shell
./manage.sh shell school_main

# In Frappe console:
bench --site your-site set-password principal@school.local 'NewSecurePassword123!'
```

### Disable Sample Users
Once you've created real users, disable sample accounts:
1. Go to Setup > User
2. Find sample users
3. Click on user
4. Uncheck "Enabled"

### Delete Sample Data
To remove all sample students and guardians:
```bash
# Access backend
./manage.sh shell school_main

# In container
bench --site your-site console

# In Python console:
import frappe
frappe.delete_doc("Student", "rahul-sharma", force=1)
# Repeat for other students
```

## 📊 What's Already Configured

✅ 20 Academic Programs  
✅ Fee Structures for 13 classes  
✅ 22 Transportation routes  
✅ Sample users with proper roles  
✅ 5 Enrolled students with guardians  
✅ Module visibility (only Education & Accounting)  
✅ Academic Year 2024-25  
✅ 2 Terms (First & Second)  

## 🎯 Next Steps

1. **Customize for Your School**
   - Update school name and address
   - Modify fee structures if needed
   - Add/remove transportation routes
   - Adjust academic calendar

2. **Add Real Data**
   - Import actual student list
   - Create real teacher accounts
   - Set up your fee structure
   - Configure payment methods

3. **Configure Advanced Features**
   - Email notifications
   - SMS integration
   - Parent portal access
   - Online fee payment

4. **Security & Backup**
   - Change all default passwords
   - Set up automated backups
   - Configure SSL for production
   - Enable two-factor authentication

## 📞 Need Help?

- View system logs: `./manage.sh logs school_main`
- Access shell: `./manage.sh shell school_main`
- Check documentation: https://docs.erpnext.com
- Education app guide: https://github.com/frappe/education

---

**Note:** All sample data is for demonstration purposes. Replace with real data before going to production!
