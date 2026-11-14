import os
import sys

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

import app.db.base
from app.db.session import SessionLocal
from sqlalchemy import text
from app.core.security import get_password_hash
from app.models.account import Account, AccountRole, Admin, Employee, Client
from datetime import date
from decimal import Decimal

def reset_accounts():
    db = SessionLocal()
    try:
        print("[*] Removing all existing login accounts...")
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        db.execute(text("DELETE FROM admins"))
        db.execute(text("DELETE FROM employees"))
        db.execute(text("DELETE FROM clients"))
        db.execute(text("DELETE FROM accounts"))
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        db.commit()

        common_password = "Admin@123"
        hashed_pw = get_password_hash(common_password)

        # 1. Admin: prathameshnehere@gmail.com
        admin_acc = Account(
            email="prathameshnehere@gmail.com",
            username="prathamesh_nehere",
            password_hash=hashed_pw,
            role=AccountRole.ADMIN,
            is_active=True
        )
        db.add(admin_acc)
        db.flush()

        admin_prof = Admin(
            account_id=admin_acc.account_id,
            full_name="Prathamesh Nehere",
            phone="+91 98765 43210"
        )
        db.add(admin_prof)
        print(f"[OK] Added Admin: {admin_acc.email}")

        # 2. Employee: sahilmahale@gmail.com
        emp_acc = Account(
            email="sahilmahale@gmail.com",
            username="sahil_mahale",
            password_hash=hashed_pw,
            role=AccountRole.EMPLOYEE,
            is_active=True
        )
        db.add(emp_acc)
        db.flush()

        emp_prof = Employee(
            account_id=emp_acc.account_id,
            full_name="Sahil Mahale",
            phone="+91 98765 43211",
            joining_date=date.today(),
            department="Creative Operations",
            job_title="Senior Creative Strategist",
            access_level="editor",
            billable_rate=Decimal("150.00"),
            max_weekly_hours=40
        )
        db.add(emp_prof)
        print(f"[OK] Added Employee: {emp_acc.email}")

        # 3. Client: saichakankar@gmail.com
        cli_acc = Account(
            email="saichakankar@gmail.com",
            username="sai_chakankar",
            password_hash=hashed_pw,
            role=AccountRole.CLIENT,
            is_active=True
        )
        db.add(cli_acc)
        db.flush()

        cli_prof = Client(
            account_id=cli_acc.account_id,
            business_name="Chakankar Digital Innovations",
            industry="IT / Software / Technology",
            brand_description="Enterprise digital media and cloud solutions.",
            contact_person="Sai Chakankar"
        )
        db.add(cli_prof)
        print(f"[OK] Added Client: {cli_acc.email}")

        db.commit()
        print("\n[SUCCESS] All accounts reset successfully. Active accounts:")
        for a in db.query(Account).all():
            print(f"  - ID: {a.account_id} | Email: {a.email} | Role: {a.role.value}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to reset accounts: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_accounts()

