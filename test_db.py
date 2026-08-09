import cx_Oracle
import os
from dotenv import load_dotenv

load_dotenv()
dsn = cx_Oracle.makedsn(os.environ.get("DB_HOST"), os.environ.get("DB_PORT"), service_name=os.environ.get("DB_SERVICE"))
connection = cx_Oracle.connect(user=os.environ.get("DB_USER"), password=os.environ.get("DB_PASSWORD"), dsn=dsn)
cursor = connection.cursor()

cursor.execute("SELECT sequence_name FROM user_sequences")
for row in cursor.fetchall():
    print(row[0])
    try:
        cursor.execute(f"ALTER SEQUENCE {row[0]} NOCACHE")
        print(f"Altered {row[0]} to NOCACHE")
    except Exception as e:
        print(f"Error altering {row[0]}: {e}")
connection.close()
