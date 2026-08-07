var user_map = {};
var notifications_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;
window.onload = function () {
    get_notifications_data();
    get_lov_data();
    initMessageObserver();
    document.getElementById("notificationId").oninput = function () {
        if (find_clicked) {
            position = -1;
            record_id = document.getElementById("notificationId").value.trim();
            if (record_id == "") {
                clear_fields();
                return;
            }
            search_record();
        }
    };
    set_mode('New', true);
};
function clear_fields() {
    document.getElementById("notificationId").value = "";
    document.getElementById("title").value = "";
    document.getElementById("userId").value = "";
    if(document.getElementById("userId_display")) document.getElementById("userId_display").value = "";
    document.getElementById("message").value = "";
    document.getElementById("isRead").value = "";
    if(document.getElementById("isRead_display")) document.getElementById("isRead_display").value = "";
}
function clear_msgs() {
    document.getElementById("titleMsg").innerHTML = "";
    document.getElementById("userIdMsg").innerHTML = "";
    document.getElementById("messageMsg").innerHTML = "";
    document.getElementById("isReadMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";
    document.getElementById("msg").className = "";
}
function set_mode(mode, force) {
    if (!force && mode === 'Find' && find_clicked) return;
    if (!force && mode === 'New' && !find_clicked) return;
    clear_fields();
    document.getElementById("isRead").value = mode === 'Find' ? "" : "Unread";
    clear_msgs();
    record_id = "";
    position = -1;
    if (mode === 'Find') {
        find_clicked = true;
        document.getElementById("findModeBtn").classList.add("active");
        document.getElementById("newModeBtn").classList.remove("active");
        document.getElementById("saveBtn").innerHTML = "Update";
        document.getElementById("nextBtn").style.display = "inline-block";
        document.getElementById("notificationId").readOnly = false;
        document.getElementById("notificationId").style.cursor = "text";
        document.getElementById("notificationId").style.backgroundColor = "white";
        document.getElementById("notificationId").focus();
    } else {
        find_clicked = false;
        document.getElementById("findModeBtn").classList.remove("active");
        document.getElementById("newModeBtn").classList.add("active");
        document.getElementById("saveBtn").innerHTML = "Save";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "inline-block";
        document.getElementById("notificationId").readOnly = true;
        document.getElementById("notificationId").style.cursor = "not-allowed";
        document.getElementById("notificationId").style.backgroundColor = "#eee";
        set_next_id();
        document.getElementById("title").focus();
    }
}
function save_data(successCallback) {
    var title = document.getElementById("title").value.trim();
    var userId = document.getElementById("userId").value.trim();
    var message = document.getElementById("message").value.trim();
    var isRead = document.getElementById("isRead").value;
    clear_msgs();
    var has_error = false;
    if (title == "") { document.getElementById("titleMsg").innerHTML = "Required"; has_error = true; }
    if (userId == "") { document.getElementById("userIdMsg").innerHTML = "Required"; has_error = true; }
    if (message == "") { document.getElementById("messageMsg").innerHTML = "Required"; has_error = true; }
    if (isRead === "") { document.getElementById("isReadMsg").innerHTML = "Required"; has_error = true; }
    if (has_error) return false;
    if (find_clicked && record_id == "") {
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Search record first";
        return false;
    }
    var data = { id: record_id, user_id: userId, title: title, message: message, is_read: isRead };
    fetch("/saveNotification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(function (response) { return response.text(); })
        .then(function (reply) {
            if (reply.toLowerCase().includes("ora-") || reply.toLowerCase().includes("error") || reply.toLowerCase().includes("fail")) {
                document.getElementById("msg").className = "msg-error";
                document.getElementById("msg").innerHTML = "Failed to save record";
                return;
            }
            document.getElementById("msg").className = "msg-success";
            document.getElementById("msg").innerHTML = find_clicked ? "Updated successfully" : "Saved successfully";
            if (find_clicked && position !== -1) {
                notifications_data[position][1] = userId;
                notifications_data[position][2] = title;
                notifications_data[position][3] = message;
                notifications_data[position][4] = isRead;
            }
            get_notifications_data();
            if (!find_clicked) {
                clear_fields();
                document.getElementById("isRead").value = "Unread";
                if(document.getElementById("isRead_display")) document.getElementById("isRead_display").value = "Unread";
                record_id = "";
                position = -1;
                document.getElementById("findModeBtn").classList.remove("active");
                document.getElementById("newModeBtn").classList.add("active");
                document.getElementById("saveBtn").innerHTML = "Save";
            } else {
                document.getElementById("saveBtn").innerHTML = "Update";
            }
            if (successCallback) successCallback();
        })
        .catch(function () {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "Failed to save record";
        });
}
function search_record() {
    var searchId = document.getElementById("notificationId").value.trim();
    if (searchId == "") {
        clear_fields();
        document.getElementById("isRead").value = "";
    if(document.getElementById("isRead_display")) document.getElementById("isRead_display").value = "";
        record_id = "";
        position = -1;
        return;
    }
    var found = false;
    for (var i = 0; i < notifications_data.length; i++) {
        if (notifications_data[i][0] && notifications_data[i][0].toString() == searchId) {
            position = i;
            record_id = notifications_data[i][0];
            found = true;
            break;
        }
    }
    if (found) {
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    } else {
        document.getElementById("title").value = "";
        document.getElementById("userId").value = "";
    if(document.getElementById("userId_display")) document.getElementById("userId_display").value = "";
        document.getElementById("message").value = "";
        document.getElementById("isRead").value = "";
    if(document.getElementById("isRead_display")) document.getElementById("isRead_display").value = "";
        record_id = searchId;
        position = -1;
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Record Not found";
    }
}
function next_data() {
    navigateWithCheck(function () {
        if (notifications_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
        if (position == -1) { position = 0; }
        else if (position < notifications_data.length - 1) { position = position + 1; }
        else {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    });
}
function previous_data() {
    navigateWithCheck(function () {
        if (notifications_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
        if (position == -1) { position = notifications_data.length - 1; }
        else if (position > 0) { position = position - 1; }
        else {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    });
}
function show_data() {
    if (position < 0 || position >= notifications_data.length) return;
    record_id = notifications_data[position][0];
    document.getElementById("notificationId").value = record_id;
    var uid = notifications_data[position][1] || "";
    document.getElementById("userId").value = uid;
    if (document.getElementById("userId_display")) {
        document.getElementById("userId_display").value = user_map[uid] || uid;
    }
    document.getElementById("title").value = notifications_data[position][2] || "";
    document.getElementById("message").value = notifications_data[position][3] || "";
    var readVal = notifications_data[position][4];
    if (readVal === 1 || readVal === "1") readVal = "Read";
    else if (readVal === 0 || readVal === "0") readVal = "Unread";
    document.getElementById("isRead").value = readVal || "";
    if (document.getElementById("isRead_display")) {
        document.getElementById("isRead_display").value = readVal || "";
    }
    find_clicked = true;
    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("saveBtn").innerHTML = "Update";
    document.getElementById("nextBtn").style.display = "inline-block";
    document.getElementById("notificationId").readOnly = false;
    document.getElementById("notificationId").style.cursor = "text";
    document.getElementById("notificationId").style.backgroundColor = "white";
    clear_msgs();
}
function set_next_id() {
    var max_id = 0;
    for (var i = 0; i < notifications_data.length; i++) {
        var current_id = parseInt(notifications_data[i][0]);
        if (!isNaN(current_id) && current_id > max_id) max_id = current_id;
    }
    document.getElementById("notificationId").value = max_id + 1;
}
function get_notifications_data() {
    fetch("/getNotifications")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            notifications_data = data;
            if (!find_clicked && record_id == "") {
                set_next_id();
            } else if (record_id != "") {
                for (var i = 0; i < notifications_data.length; i++) {
                    if (notifications_data[i][0] == record_id) { position = i; break; }
                }
            }
        })
        .catch(function () {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "Unable to load records";
        });
}
function get_lov_data() {
    fetch("/getLOV")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            var statusTbody = document.querySelector("#table_isRead tbody");
            if (statusTbody) statusTbody.innerHTML = '';
            for (var i = 0; i < data.length; i++) {
                var lovType = data[i][0];
                var lovValue = data[i][2];
                if (lovType === "READ_STATUS" && statusTbody) {
                    var tr = document.createElement("tr");
                    tr.innerHTML = "<td>" + lovValue + "</td>";
                    tr.onclick = (function(val) {
                        return function() { selectOption("isRead", val, val); };
                    })(lovValue);
                    statusTbody.appendChild(tr);
                }
            }
            if (!find_clicked) {
                document.getElementById("isRead").value = "Unread";
                if(document.getElementById("isRead_display")) document.getElementById("isRead_display").value = "Unread";
            }
        });
    fetch("/getUsers")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            var userTbody = document.querySelector("#table_userId tbody");
            if (userTbody) userTbody.innerHTML = '';
            for (var i = 0; i < data.length; i++) {
                var id = data[i][0];
                var name = data[i][2] || "";
                var display = id + " - " + name;
                user_map[id] = display;
                var tr = document.createElement("tr");
                tr.innerHTML = "<td>" + id + "</td><td>" + name + "</td>";
                tr.onclick = (function(v, d) {
                    return function() { selectOption("userId", v, d); };
                })(id, display);
                if (userTbody) userTbody.appendChild(tr);
            }
        })
        .catch(function(err) { console.error("Error loading users", err); });
}
function exit_page() {
    navigateWithCheck(function () { window.history.back(); });
}
function checkDirtyState() {
    var title = document.getElementById("title").value.trim();
    var userId = document.getElementById("userId").value.trim();
    var message = document.getElementById("message").value.trim();
    var isRead = document.getElementById("isRead").value;
    if (find_clicked == false && position == -1) {
        if (title !== "" || userId !== "" || message !== "" || (isRead !== "" && isRead !== "Unread")) {
            return "edit";
        }
        return false;
    }
    if (position >= 0 && position < notifications_data.length) {
        var p = notifications_data[position];
        var readVal = p[4] != null ? p[4].toString() : "";
        if (readVal === "1") readVal = "Read";
        else if (readVal === "0") readVal = "Unread";
        if (title !== (p[2] != null ? p[2].toString().trim() : "") ||
            userId !== (p[1] != null ? p[1].toString().trim() : "") ||
            message !== (p[3] != null ? p[3].toString().trim() : "") ||
            isRead !== readVal) {
            return "edit";
        }
    }
    return false;
}
