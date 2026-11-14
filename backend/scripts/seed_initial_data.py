"""
SocialOps Database Initialization Script.
Ensures base agency packages exist.
Demo data insertion logic has been removed as per clean production standards.
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from decimal import Decimal
from app.db.session import SessionLocal
import app.db.base  # Ensures all SQLAlchemy mappers are loaded in registry
from app.models.social import Package


def init_database():
    """
    Ensures standard agency package tiers exist.
    Does not insert dummy accounts, tasks, or financial records.
    """
    db = SessionLocal()
    try:
        print("[*] Initializing SocialOps service package tiers...")

        packages_data = [
            {
                "name": "Enterprise Retainer",
                "description": "Full-service multi-channel strategy, 24/7 account management, daily shortform production, and influencer orchestration.",
                "monthly_price": Decimal("24000.00"),
                "platforms_included": "Omnichannel (5+)",
                "account_manager_included": True,
                "performance_report_included": True,
                "paid_ads_included": True,
                "influencer_coordination": True,
                "reels_per_month": 20,
                "posts_per_month": 40,
                "stories_per_month": 60,
                "revision_rounds": 5,
                "is_active": True
            },
            {
                "name": "Growth Acceleration",
                "description": "Dedicated content strategist, weekly production sprints, paid amplify management, and weekly analytics reporting.",
                "monthly_price": Decimal("14500.00"),
                "platforms_included": "3 Platforms",
                "account_manager_included": True,
                "performance_report_included": True,
                "paid_ads_included": True,
                "influencer_coordination": False,
                "reels_per_month": 12,
                "posts_per_month": 24,
                "stories_per_month": 30,
                "revision_rounds": 3,
                "is_active": True
            },
            {
                "name": "Starter Presence",
                "description": "Essential brand voice consistency, high-impact monthly deliverables, and bi-weekly community monitoring.",
                "monthly_price": Decimal("7500.00"),
                "platforms_included": "2 Platforms",
                "account_manager_included": False,
                "performance_report_included": True,
                "paid_ads_included": False,
                "influencer_coordination": False,
                "reels_per_month": 4,
                "posts_per_month": 12,
                "stories_per_month": 15,
                "revision_rounds": 2,
                "is_active": True
            }
        ]

        for pkg_item in packages_data:
            existing = db.query(Package).filter(Package.name == pkg_item["name"]).first()
            if not existing:
                pkg = Package(**pkg_item)
                db.add(pkg)
                db.flush()
                print(f"[OK] Initialized Package Tier: {pkg_item['name']}")

        db.commit()
        print("[OK] Initialization completed successfully without dummy data.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Initialization failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
