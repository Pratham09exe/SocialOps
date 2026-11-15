import os
import sys

# Ensure backend root on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import engine
from sqlalchemy import text

def purge_all_review_requests():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            d_att = conn.execute(text("DELETE FROM attachments WHERE feedback_id IS NOT NULL")).rowcount
            d_appr = conn.execute(text("DELETE FROM approvals")).rowcount
            d_fb = conn.execute(text("DELETE FROM client_feedbacks")).rowcount
            d_ci = conn.execute(text("DELETE FROM content_items")).rowcount
            d_cpt = conn.execute(text("DELETE FROM content_plan_targets")).rowcount
            d_cp = conn.execute(text("DELETE FROM content_plans")).rowcount
            d_notif = conn.execute(text("DELETE FROM notifications WHERE entity_type = 'ContentItem'")).rowcount
            d_act = conn.execute(text("DELETE FROM activity_logs WHERE entity_type = 'ContentItem'")).rowcount
            trans.commit()
            print(f"Purge complete: approvals={d_appr}, client_feedbacks={d_fb}, content_items={d_ci}, content_plans={d_cp}, attachments={d_att}, notifications={d_notif}, activity_logs={d_act}")
        except Exception as e:
            trans.rollback()
            print("Purge error:", e)
            raise e

if __name__ == "__main__":
    purge_all_review_requests()
