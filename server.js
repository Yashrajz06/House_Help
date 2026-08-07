require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;
oracledb.autoCommit = true;
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_DSN
};
const PORT = 3000;
const server = http.createServer(async (req, res) => {
    let connection;
    try {
        if (req.method === 'GET') {
            let filePath = './public' + req.url;
            if (filePath === './public/') {
                filePath = './public/users_form.html';
            }
            if (req.url === '/booking') {
                filePath = './public/booking_form.html';
            }
            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json'
            };
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            if (extname === '.html' || extname === '.js' || extname === '.css') {
                fs.readFile(filePath, (error, content) => {
                    if (error) {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('File not found', 'utf-8');
                    } else {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content, 'utf-8');
                    }
                });
                return;
            }
            try {
                connection = await oracledb.getConnection(dbConfig);
                if (req.url === '/getUsers') {
                    const result = await connection.execute(`SELECT USER_ID, USER_TYPE, FULL_NAME, MOBILE_NO, EMAIL, PASSWORD_HASH, IS_ACTIVE FROM USERS ORDER BY USER_ID`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result.rows));
                } else if (req.url === '/getAuditLogs') {
                    const result = await connection.execute(`SELECT AUDIT_ID, USER_ID, ACTION, ACTION_DATE FROM AUDIT_LOG ORDER BY AUDIT_ID`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result.rows));
                } else if (req.url === '/getNotifications') {
                    const result = await connection.execute(`SELECT NOTIFICATION_ID, USER_ID, TITLE, MESSAGE, IS_READ FROM NOTIFICATIONS ORDER BY NOTIFICATION_ID`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result.rows));
                } else if (req.url === '/getAllLOVs') {
                    const result = await connection.execute(`SELECT LOV_ID, LOV_TYPE, LOV_CODE, LOV_VALUE, DISPLAY_ORDER, IS_ACTIVE, DESCRIPTION FROM LOV ORDER BY LOV_ID`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result.rows));
                } else if (req.url === '/getLOV') {
                    const result = await connection.execute(`SELECT LOV_TYPE, LOV_CODE, LOV_VALUE FROM LOV WHERE IS_ACTIVE = 'Y' ORDER BY DISPLAY_ORDER`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result.rows));
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    connection = await oracledb.getConnection(dbConfig);
                    if (req.url === '/saveUser') {
                        if (data.id) {
                            await connection.execute(
                                `UPDATE USERS SET USER_TYPE = :type, FULL_NAME = :name, MOBILE_NO = :mob, EMAIL = :email, PASSWORD_HASH = :pwd, IS_ACTIVE = :active WHERE USER_ID = :id`,
                                [data.user_type, data.full_name, data.mobile_no, data.email, data.password_hash, data.is_active, data.id]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Updated Successfully');
                        } else {
                            const result = await connection.execute(`SELECT NVL(MAX(USER_ID), 0) + 1 AS MAX_ID FROM USERS`);
                            const newId = result.rows[0][0];
                            await connection.execute(
                                `INSERT INTO USERS (USER_ID, USER_TYPE, FULL_NAME, MOBILE_NO, EMAIL, PASSWORD_HASH, IS_ACTIVE) VALUES (:id, :type, :name, :mob, :email, :pwd, :active)`,
                                [newId, data.user_type, data.full_name, data.mobile_no, data.email, data.password_hash, data.is_active]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Inserted Successfully');
                        }
                    } else if (req.url === '/saveAuditLog') {
                        if (data.id) {
                            await connection.execute(
                                `UPDATE AUDIT_LOG SET USER_ID = :userId, ACTION = :action, ACTION_DATE = TO_DATE(:actionDate, 'YYYY-MM-DD') WHERE AUDIT_ID = :id`,
                                [data.user_id, data.action, data.action_date, data.id]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Updated Successfully');
                        } else {
                            await connection.execute(
                                `INSERT INTO AUDIT_LOG (USER_ID, ACTION, ACTION_DATE) VALUES (:userId, :action, TO_DATE(:actionDate, 'YYYY-MM-DD'))`,
                                [data.user_id, data.action, data.action_date]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Inserted Successfully');
                        }
                    } else if (req.url === '/saveNotification') {
                        if (data.id) {
                            await connection.execute(
                                `UPDATE NOTIFICATIONS SET USER_ID = :userId, TITLE = :title, MESSAGE = :message, IS_READ = :isRead WHERE NOTIFICATION_ID = :id`,
                                [data.user_id, data.title, data.message, data.is_read, data.id]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Updated Successfully');
                        } else {
                            await connection.execute(
                                `INSERT INTO NOTIFICATIONS (USER_ID, TITLE, MESSAGE, IS_READ) VALUES (:userId, :title, :message, :isRead)`,
                                [data.user_id, data.title, data.message, data.is_read]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Inserted Successfully');
                        }
                    } else if (req.url === '/saveLOVMaster') {
                        if (data.id) {
                            await connection.execute(
                                `UPDATE LOV SET LOV_TYPE = :lovType, LOV_CODE = :lovCode, LOV_VALUE = :lovValue, IS_ACTIVE = :isActive WHERE LOV_ID = :id`,
                                [data.lov_type, data.lov_code, data.lov_value, data.is_active, data.id]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Updated Successfully');
                        } else {
                            const result = await connection.execute(`SELECT NVL(MAX(LOV_ID), 0) + 1 AS MAX_ID FROM LOV`);
                            const newId = result.rows[0][0];
                            await connection.execute(
                                `INSERT INTO LOV (LOV_ID, LOV_TYPE, LOV_CODE, LOV_VALUE, IS_ACTIVE) VALUES (:id, :lovType, :lovCode, :lovValue, :isActive)`,
                                [newId, data.lov_type, data.lov_code, data.lov_value, data.is_active]
                            );
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Record Inserted Successfully');
                        }
                    } else {
                        res.writeHead(404);
                        res.end('Not found');
                    }
                } catch (e) {
                    console.error(e);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error: ' + e.message);
                } finally {
                    if (connection) {
                        try {
                            await connection.close();
                        } catch (err) {
                            console.error(err);
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error(e);
            }
        }
    }
});
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});
