from main import get_db_connection

connection = get_db_connection()
cursor = connection.cursor()

cursor.execute("SELECT sequence_name FROM user_sequences")
for row in cursor.fetchall():
    print(row[0])
    try:
        cursor.execute(f"ALTER SEQUENCE {row[0]} NOCACHE")
        print(f"Altered {row[0]} to NOCACHE")
    except Exception as e:
        print(f"Error altering {row[0]}: {e}")
connection.commit()
connection.close()
