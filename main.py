import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import oracledb

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Config — loaded from .env
db_config = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn": os.getenv("DB_DSN")
}

oracledb.defaults.autocommit = True

def get_db_connection():
    return oracledb.connect(**db_config)

class Notification(BaseModel):
    id: int | str | None = None
    user_id: int | str | None = None
    title: str | None = None
    message: str | None = None
    is_read: int | str | None = None

class AuditLog(BaseModel):
    id: int | str | None = None
    user_id: int | str | None = None
    action: str | None = None
    action_date: str | None = None

class Payment(BaseModel):
    id: int | str | None = None
    booking_id: int | str | None = None
    amount: float | None = None
    payment_mode: str | None = None
    payment_status: str | None = None
    payment_date: str | None = None

@app.get("/getNotifications")
def get_notifications():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT NOTIFICATION_ID, USER_ID, TITLE, MESSAGE, IS_READ FROM NOTIFICATIONS ORDER BY NOTIFICATION_ID")
            rows = []
            for row in cursor.fetchall():
                safe_row = []
                for v in row:
                    if v is None:
                        safe_row.append(None)
                    elif hasattr(v, 'read'):  # LOB object
                        safe_row.append(v.read())
                    elif hasattr(v, 'isoformat'):  # date/datetime
                        safe_row.append(v.isoformat())
                    elif not isinstance(v, (int, float, bool, str)):
                        safe_row.append(str(v))
                    else:
                        safe_row.append(v)
                rows.append(safe_row)
            return rows

@app.post("/saveNotification")
def save_notification(data: Notification):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if data.id:
                cursor.execute(
                    "UPDATE NOTIFICATIONS SET USER_ID = :1, TITLE = :2, MESSAGE = :3, IS_READ = :4 WHERE NOTIFICATION_ID = :5",
                    [data.user_id, data.title, data.message, data.is_read, data.id]
                )
                return PlainTextResponse("Record Updated Successfully")
            else:
                cursor.execute(
                    "INSERT INTO NOTIFICATIONS (USER_ID, TITLE, MESSAGE, IS_READ) VALUES (:1, :2, :3, :4)",
                    [data.user_id, data.title, data.message, data.is_read]
                )
                return PlainTextResponse("Record Inserted Successfully")

@app.post("/notification/save")
def save_notification_rest(data: Notification):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if data.id:
                cursor.execute(
                    "UPDATE NOTIFICATIONS SET USER_ID = :1, TITLE = :2, MESSAGE = :3, IS_READ = :4 WHERE NOTIFICATION_ID = :5",
                    [data.user_id, data.title, data.message, data.is_read, data.id]
                )
                return {"status": "success", "message": "Record Updated Successfully"}
            else:
                cursor.execute(
                    "INSERT INTO NOTIFICATIONS (USER_ID, TITLE, MESSAGE, IS_READ) VALUES (:1, :2, :3, :4)",
                    [data.user_id, data.title, data.message, data.is_read]
                )
                return {"status": "success", "message": "Record Inserted Successfully"}

@app.get("/notification/list")
def get_notifications_rest():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT NOTIFICATION_ID, USER_ID, TITLE, MESSAGE, IS_READ FROM NOTIFICATIONS ORDER BY NOTIFICATION_ID")
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

@app.get("/getAuditLogs")
def get_audit_logs():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT AUDIT_ID, USER_ID, ACTION, ACTION_DATE FROM AUDIT_LOG ORDER BY AUDIT_ID")
            rows = []
            for row in cursor.fetchall():
                safe_row = []
                for v in row:
                    if v is None:
                        safe_row.append(None)
                    elif hasattr(v, 'read'):  # LOB object
                        safe_row.append(v.read())
                    elif hasattr(v, 'isoformat'):  # date/datetime
                        safe_row.append(v.isoformat())
                    elif not isinstance(v, (int, float, bool, str)):
                        safe_row.append(str(v))
                    else:
                        safe_row.append(v)
                rows.append(safe_row)
            return rows

@app.post("/saveAuditLog")
def save_audit_log(data: AuditLog):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if data.id:
                cursor.execute(
                    "UPDATE AUDIT_LOG SET USER_ID = :1, ACTION = :2, ACTION_DATE = TO_DATE(:3, 'YYYY-MM-DD') WHERE AUDIT_ID = :4",
                    [data.user_id, data.action, data.action_date, data.id]
                )
                return PlainTextResponse("Record Updated Successfully")
            else:
                cursor.execute(
                    "INSERT INTO AUDIT_LOG (USER_ID, ACTION, ACTION_DATE) VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'))",
                    [data.user_id, data.action, data.action_date]
                )
                return PlainTextResponse("Record Inserted Successfully")

@app.post("/audit/save")
def save_audit_log_rest(data: AuditLog):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if data.id:
                cursor.execute(
                    "UPDATE AUDIT_LOG SET USER_ID = :1, ACTION = :2, ACTION_DATE = TO_DATE(:3, 'YYYY-MM-DD') WHERE AUDIT_ID = :4",
                    [data.user_id, data.action, data.action_date, data.id]
                )
                return {"status": "success", "message": "Record Updated Successfully"}
            else:
                cursor.execute(
                    "INSERT INTO AUDIT_LOG (USER_ID, ACTION, ACTION_DATE) VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'))",
                    [data.user_id, data.action, data.action_date]
                )
                return {"status": "success", "message": "Record Inserted Successfully"}

@app.get("/audit/list")
def get_audit_logs_rest():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT AUDIT_ID, USER_ID, ACTION, ACTION_DATE FROM AUDIT_LOG ORDER BY AUDIT_ID")
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

@app.get("/getUsers")
def get_users():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT USER_ID, USER_TYPE, FULL_NAME, MOBILE_NO, EMAIL, PASSWORD_HASH, IS_ACTIVE FROM USERS ORDER BY USER_ID")
            rows = []
            for row in cursor.fetchall():
                safe_row = []
                for v in row:
                    if v is None:
                        safe_row.append(None)
                    elif hasattr(v, 'read'):  # LOB object
                        safe_row.append(v.read())
                    else:
                        safe_row.append(str(v) if not isinstance(v, (int, float, bool)) else v)
                rows.append(safe_row)
            return rows

@app.get("/getLOV")
def get_lov():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT LOV_TYPE, LOV_CODE, LOV_VALUE FROM LOV WHERE IS_ACTIVE = 'Y' ORDER BY DISPLAY_ORDER")
            return cursor.fetchall()

@app.get("/getPayments")
def get_payments():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT PAYMENT_ID, BOOKING_ID, AMOUNT, PAYMENT_MODE, PAYMENT_STATUS, PAYMENT_DATE FROM PAYMENTS ORDER BY PAYMENT_ID")
            rows = []
            for row in cursor.fetchall():
                safe_row = []
                for v in row:
                    if v is None:
                        safe_row.append(None)
                    elif hasattr(v, 'read'):  # LOB
                        safe_row.append(v.read())
                    elif hasattr(v, 'isoformat'):  # datetime / date
                        safe_row.append(v.isoformat())
                    else:
                        safe_row.append(str(v) if not isinstance(v, (int, float, bool)) else v)
                rows.append(safe_row)
            return rows

@app.get("/getBookings")
def get_bookings():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT BOOKING_ID, CUSTOMER_ID, PROVIDER_ID FROM BOOKINGS ORDER BY BOOKING_ID")
            rows = []
            for row in cursor.fetchall():
                safe_row = [str(v) if v is not None else None for v in row]
                rows.append(safe_row)
            return rows

@app.post("/savePayment")
def save_payment(payment: Payment):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if payment.id:
                cursor.execute(
                    """UPDATE PAYMENTS
                       SET BOOKING_ID = :booking_id,
                           AMOUNT = :amount,
                           PAYMENT_MODE = :payment_mode,
                           PAYMENT_STATUS = :payment_status,
                           PAYMENT_DATE = TO_DATE(:payment_date, 'YYYY-MM-DD')
                       WHERE PAYMENT_ID = :id""",
                    booking_id=payment.booking_id or None,
                    amount=payment.amount,
                    payment_mode=payment.payment_mode,
                    payment_status=payment.payment_status,
                    payment_date=payment.payment_date or None,
                    id=payment.id
                )
                return PlainTextResponse("Record Updated Successfully")
            else:
                cursor.execute(
                    """INSERT INTO PAYMENTS (BOOKING_ID, AMOUNT, PAYMENT_MODE, PAYMENT_STATUS, PAYMENT_DATE)
                       VALUES (:booking_id, :amount, :payment_mode, :payment_status,
                               TO_DATE(:payment_date, 'YYYY-MM-DD'))""",
                    booking_id=payment.booking_id or None,
                    amount=payment.amount,
                    payment_mode=payment.payment_mode,
                    payment_status=payment.payment_status,
                    payment_date=payment.payment_date or None
                )
                return PlainTextResponse("Record Inserted Successfully")

# Serve root file and static files at the end so it doesn't mask API routes
@app.get("/")
def read_root():
    return FileResponse("public/notifications_form.html")

app.mount("/", StaticFiles(directory="public", html=True), name="static")
