import logging
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_admin():
    if not settings.ADMIN_PASSWORD:
        logger.warning(
            "ADMIN_PASSWORD 未设置，跳过管理员初始化。"
            "请在 .env 文件或环境变量中设置 ADMIN_PASSWORD。"
        )
        return

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if existing:
            logger.info("Admin user '%s' already exists.", settings.ADMIN_USERNAME)
            return

        admin = User(
            username=settings.ADMIN_USERNAME,
            password_hash=pwd_context.hash(settings.ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)
        db.commit()
        logger.info("Admin user '%s' created.", settings.ADMIN_USERNAME)
    except Exception as e:
        logger.error("Failed to create admin user: %s", str(e))
        db.rollback()
    finally:
        db.close()
