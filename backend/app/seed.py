from app.database import Base, engine


def seed():
    """Khởi tạo cấu trúc cơ sở dữ liệu, không tạo tài khoản hoặc dữ liệu demo."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    seed()
