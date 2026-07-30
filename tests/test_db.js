const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;
async function run() {
    let conn;
    try {
        conn = await oracledb.getConnection({
            user: "HOUSEHELP627_SCHEMA_X8M1N",
            password: "Z$8HUL8VMKM0LL1S7HFK124SBX85oJ",
            connectString: "tcps://db.freesql.com:2484/23ai_34ui2"
        });
        const result = await conn.execute("SELECT DISTINCT LOV_TYPE FROM LOV");
        console.log("LOV_TYPES:", result.rows);
    } catch(e) { console.error(e); } finally { if(conn) await conn.close(); }
}
run();
