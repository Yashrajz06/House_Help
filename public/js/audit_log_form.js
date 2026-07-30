var user_map = {};
var audit_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;


window.onload = function () {
    get_audit_data();
    get_lov_data();

    initMessageObserver();

    document.getElementById("auditId").oninput = function () {
        if (find_clicked) {
            position = -1;
            record_id = document.getElementById("auditId").value.trim();
            
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
    document.getElementById("auditId").value = "";
    document.getElementById("userId").value = "";
    if(document.getElementById("userId_display")) document.getElementById("userId_display").value = "";
    document.getElementById("action").value = "";
    document.getElementById("actionDate").value = "";
}

function clear_msgs() {
    document.getElementById("userIdMsg").innerHTML = "";
    document.getElementById("actionMsg").innerHTML = "";
    document.getElementById("actionDateMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";
    document.getElementById("msg").className = "";
}

function get_today() {
    var d = new Date();
    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
    var dd = ("0" + d.getDate()).slice(-2);
    return d.getFullYear() + "-" + mm + "-" + dd;
}

function set_mode(mode, force) {
    if (!force && mode === 'Find' && find_clicked) return;
    if (!force && mode === 'New' && !find_clicked) return;

    clear_fields();
    if (mode !== 'Find') {
        document.getElementById("actionDate").value = get_today();
    }
    clear_msgs();

    record_id = "";
    position = -1;

    if (mode === 'Find') {
        find_clicked = true;
        document.getElementById("findModeBtn").classList.add("active");
        document.getElementById("newModeBtn").classList.remove("active");
        document.getElementById("saveBtn").innerHTML = "Update";
        document.getElementById("nextBtn").style.display = "inline-block";
        document.getElementById("auditId").readOnly = false;
        document.getElementById("auditId").style.cursor = "text";
        document.getElementById("auditId").style.backgroundColor = "white";
        document.getElementById("auditId").focus();
    } else {
        find_clicked = false;
        document.getElementById("findModeBtn").classList.remove("active");
        document.getElementById("newModeBtn").classList.add("active");
        document.getElementById("saveBtn").innerHTML = "Save";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "inline-block";
        document.getElementById("auditId").readOnly = true;
        document.getElementById("auditId").style.cursor = "not-allowed";
        document.getElementById("auditId").style.backgroundColor = "#eee";
        set_next_id();
        document.getElementById("action").focus();
    }
}

function save_data(successCallback) {
    var userId = document.getElementById("userId").value.trim();
    var action = document.getElementById("action").value.trim();
    var actionDate = document.getElementById("actionDate").value.trim();

    clear_msgs();
    var has_error = false;

    if (action == "") { document.getElementById("actionMsg").innerHTML = "Required"; has_error = true; }
    if (actionDate == "") { document.getElementById("actionDateMsg").innerHTML = "Required"; has_error = true; }

    if (has_error) return false;

    if (find_clicked && record_id == "") {
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Search record first";
        return false;
    }

    var data = { id: record_id, user_id: userId || null, action: action, action_date: actionDate };

    fetch("/saveAuditLog", {
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
                audit_data[position][1] = userId || null;
                audit_data[position][2] = action;
                audit_data[position][3] = actionDate;
            }
            get_audit_data();

            if (!find_clicked) {
                clear_fields();
                document.getElementById("actionDate").value = get_today();
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
    var searchId = document.getElementById("auditId").value.trim();
    if (searchId == "") {
        clear_fields();
        record_id = "";
        position = -1;
        return;
    }
    var found = false;
    for (var i = 0; i < audit_data.length; i++) {
        if (audit_data[i][0] && audit_data[i][0].toString() == searchId) {
            position = i;
            record_id = audit_data[i][0];
            found = true;
            break;
        }
    }
    if (found) {
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    } else {
        document.getElementById("userId").value = "";
    if(document.getElementById("userId_display")) document.getElementById("userId_display").value = "";
        document.getElementById("action").value = "";
        document.getElementById("actionDate").value = "";
        record_id = searchId;
        position = -1;
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Record Not found";
    }
}

function next_data() {
    navigateWithCheck(function () {
        if (audit_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
        if (position == -1) { position = 0; }
        else if (position < audit_data.length - 1) { position = position + 1; }
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
        if (audit_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
        if (position == -1) { position = audit_data.length - 1; }
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

function format_date(val) {
    if (!val) return "";
    var s = val.toString();

    if (s.indexOf("T") !== -1) return s.substring(0, 10);

    if (s.length === 10 && s.indexOf("-") !== -1) return s;
    try {
        var d = new Date(s);
        if (!isNaN(d.getTime())) {
            var mm = ("0" + (d.getMonth() + 1)).slice(-2);
            var dd = ("0" + d.getDate()).slice(-2);
            return d.getFullYear() + "-" + mm + "-" + dd;
        }
    } catch (e) { }
    return s;
}

function show_data() {
    if (position < 0 || position >= audit_data.length) return;
    record_id = audit_data[position][0];
    document.getElementById("auditId").value = record_id;
    var uid = audit_data[position][1] || "";
    document.getElementById("userId").value = uid;
    if (document.getElementById("userId_display")) {
        document.getElementById("userId_display").value = user_map[uid] || uid;
    }
    document.getElementById("action").value = audit_data[position][2] || "";
    document.getElementById("actionDate").value = format_date(audit_data[position][3]);

    find_clicked = true;
    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("saveBtn").innerHTML = "Update";
    document.getElementById("nextBtn").style.display = "inline-block";
    document.getElementById("auditId").readOnly = false;
    document.getElementById("auditId").style.cursor = "text";
    document.getElementById("auditId").style.backgroundColor = "white";
    clear_msgs();
}

function set_next_id() {
    var max_id = 0;
    for (var i = 0; i < audit_data.length; i++) {
        var current_id = parseInt(audit_data[i][0]);
        if (!isNaN(current_id) && current_id > max_id) max_id = current_id;
    }
    document.getElementById("auditId").value = max_id + 1;
}

function get_audit_data() {
    fetch("/getAuditLogs")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            audit_data = data;
            if (!find_clicked && record_id == "") {
                set_next_id();
            } else if (record_id != "") {
                for (var i = 0; i < audit_data.length; i++) {
                    if (audit_data[i][0] == record_id) { position = i; break; }
                }
            }
        })
        .catch(function () {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "Unable to load records";
        });
}

function get_lov_data() {
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
    var userId = document.getElementById("userId").value.trim();
    var action = document.getElementById("action").value.trim();
    var actionDate = document.getElementById("actionDate").value.trim();


    if (find_clicked == false && position == -1) {
        if (userId !== "" || action !== "" || (actionDate !== "" && actionDate !== get_today())) {
            return "edit";
        }
        return false;
    }
    if (position >= 0 && position < audit_data.length) {
        var p = audit_data[position];
        var dbDate = format_date(p[3]);
        if (userId !== (p[1] != null ? p[1].toString().trim() : "") ||
            action !== (p[2] != null ? p[2].toString().trim() : "") ||
            actionDate !== dbDate) {
            return "edit";
        }
    }
    return false;
}
