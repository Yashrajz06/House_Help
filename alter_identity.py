from main import get_db_connection

connection = get_db_connection()
cursor = connection.cursor()

# Find all identity columns
cursor.execute("SELECT table_name, column_name, generation_type FROM user_tab_identity_cols")
for row in cursor.fetchall():
    table_name = row[0]
    column_name = row[1]
    gen_type = row[2] # ALWAYS or BY DEFAULT
    
    # syntax to modify just the sequence properties of an identity column:
    # ALTER TABLE t MODIFY c GENERATED ALWAYS AS IDENTITY (NOCACHE);
    # Actually, we can just say "MODIFY c GENERATED AS IDENTITY (NOCACHE);" maybe? No, Oracle wants you to keep the generation type if you specify it.
    # The safest way is to just alter the sequence properties without repeating GENERATED:
    # ALTER TABLE t MODIFY c NOCACHE; (actually no, it's GENERATED AS IDENTITY (NOCACHE) or something similar)
    # The exact syntax to alter identity column sequence options:
    # ALTER TABLE table_name MODIFY column_name GENERATED ALWAYS AS IDENTITY (NOCACHE); 
    # But wait, you can just omit the GENERATED clause if you just want to change sequence parameters? No.
    # Wait, the Oracle 12c syntax to just alter sequence options is:
    # ALTER TABLE table_name MODIFY (column_name GENERATED AS IDENTITY (NOCACHE));
    # Let's try: ALTER TABLE {table_name} MODIFY {column_name} GENERATED ALWAYS AS IDENTITY (NOCACHE)
    # Let's see what gen_type is. If it's ALWAYS, we use ALWAYS.
    
    try:
        sql = f"ALTER TABLE {table_name} MODIFY {column_name} GENERATED {gen_type} AS IDENTITY (NOCACHE)"
        cursor.execute(sql)
        print(f"Altered {table_name}.{column_name} to NOCACHE")
    except Exception as e:
        print(f"Error altering {table_name}.{column_name}: {e}")
        try:
            # fallback
            sql = f"ALTER TABLE {table_name} MODIFY {column_name} GENERATED AS IDENTITY (NOCACHE)"
            cursor.execute(sql)
            print(f"Fallback altered {table_name}.{column_name} to NOCACHE")
        except Exception as e2:
            print(f"Fallback error for {table_name}.{column_name}: {e2}")

connection.commit()
connection.close()
