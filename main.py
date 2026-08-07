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
db_config = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn": os.getenv("DB_DSN")
}
oracledb.defaults.autocommit = True
try:
    db_pool = oracledb.create_pool(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dsn=os.getenv("DB_DSN"),
        min=2,
        max=5,
        increment=1
    )
except Exception as e:
    print("Error creating connection pool:", e)
    db_pool = None
def get_db_connection():
    if db_pool:
        conn = db_pool.acquire()
        conn.autocommit = True
        return conn
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
class Booking(BaseModel):
    id: int | str | None = None
    customer_id: int | str | None = None
    provider_id: int | str | None = None
    category_id: int | str | None = None
    service_date: str | None = None
    booking_status: str | None = None
    address: str | None = None
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
                    elif hasattr(v, 'read'):  
                        safe_row.append(v.read())
                    elif hasattr(v, 'isoformat'):  
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
                    elif hasattr(v, 'read'):  
                        safe_row.append(v.read())
                    elif hasattr(v, 'isoformat'):  
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
                    elif hasattr(v, 'read'):  
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
                    elif hasattr(v, 'read'):  
                        safe_row.append(v.read())
                    elif hasattr(v, 'isoformat'):  
                        safe_row.append(v.isoformat())
                    else:
                        safe_row.append(str(v) if not isinstance(v, (int, float, bool)) else v)
                rows.append(safe_row)
            return rows
@app.get("/getBookings")
def get_bookings():
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT BOOKING_ID, CUSTOMER_ID, PROVIDER_ID, CATEGORY_ID,
                              SERVICE_DATE, BOOKING_STATUS, ADDRESS
                       FROM BOOKINGS ORDER BY BOOKING_ID"""
                )
                rows = []
                for row in cursor.fetchall():
                    safe_row = []
                    for v in row:
                        if v is None:
                            safe_row.append(None)
                        elif hasattr(v, 'isoformat'):  
                            safe_row.append(v.isoformat())
                        elif hasattr(v, 'read'):  
                            safe_row.append(v.read())
                        else:
                            safe_row.append(str(v) if not isinstance(v, (int, float, bool)) else v)
                    rows.append(safe_row)
                return rows
    except Exception as e:
        import traceback
        print("[getBookings ERROR]", traceback.format_exc())
        return []
@app.get("/getDropdowns")
def get_dropdowns():
    """Returns customers, providers, categories and booking-status LOVs in one call."""
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT USER_ID, FULL_NAME FROM USERS WHERE USER_TYPE = 'Customer' ORDER BY FULL_NAME"
                )
                customers = [[str(r[0]), r[1]] for r in cursor.fetchall()]
                cursor.execute(
                    """SELECT pp.PROVIDER_ID, u.FULL_NAME, pp.CATEGORY_ID
                       FROM PROVIDER_PROFILE pp
                       JOIN USERS u ON u.USER_ID = pp.PROVIDER_ID
                       ORDER BY u.FULL_NAME"""
                )
                providers = [[str(r[0]), r[1], str(r[2])] for r in cursor.fetchall()]
                cursor.execute("SELECT CATEGORY_ID, CATEGORY_NAME FROM SERVICE_CATEGORY ORDER BY CATEGORY_NAME")
                categories = [[str(r[0]), r[1]] for r in cursor.fetchall()]
                cursor.execute(
                    "SELECT LOV_VALUE FROM LOV WHERE LOV_TYPE = 'BOOKING_STATUS' AND IS_ACTIVE = 'Y' ORDER BY DISPLAY_ORDER"
                )
                statuses = [r[0] for r in cursor.fetchall()]
                return {
                    "customers": customers,
                    "providers": providers,
                    "categories": categories,
                    "statuses": statuses
                }
    except Exception as e:
        import traceback
        print("[getDropdowns ERROR]", traceback.format_exc())
        return {"customers": [], "providers": [], "categories": [], "statuses": []}
@app.post("/saveBooking")
def save_booking(booking: Booking):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            if booking.id:
                cursor.execute(
                    """UPDATE BOOKINGS
                       SET CUSTOMER_ID = :customer_id,
                           PROVIDER_ID = :provider_id,
                           CATEGORY_ID = :category_id,
                           SERVICE_DATE = TO_TIMESTAMP(:service_date, 'YYYY-MM-DD"T"HH24:MI'),
                           BOOKING_STATUS = :booking_status,
                           ADDRESS = :address
                       WHERE BOOKING_ID = :id""",
                    customer_id=booking.customer_id,
                    provider_id=booking.provider_id,
                    category_id=booking.category_id,
                    service_date=booking.service_date,
                    booking_status=booking.booking_status,
                    address=booking.address,
                    id=booking.id
                )
                return PlainTextResponse("Record Updated Successfully")
            else:
                cursor.execute(
                    """INSERT INTO BOOKINGS
                           (CUSTOMER_ID, PROVIDER_ID, CATEGORY_ID, SERVICE_DATE, BOOKING_STATUS, ADDRESS)
                       VALUES (:customer_id, :provider_id, :category_id,
                               TO_TIMESTAMP(:service_date, 'YYYY-MM-DD"T"HH24:MI'),
                               :booking_status, :address)""",
                    customer_id=booking.customer_id,
                    provider_id=booking.provider_id,
                    category_id=booking.category_id,
                    service_date=booking.service_date,
                    booking_status=booking.booking_status,
                    address=booking.address
                )
                return PlainTextResponse("Record Inserted Successfully")
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
@app.get("/")
def read_root():
    return FileResponse("public/notifications_form.html")
app.mount("/", StaticFiles(directory="public", html=True), name="static")
