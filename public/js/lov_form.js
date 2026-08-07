var lov_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;
window.onload = function () {
    get_lov_records();
    initMessageObserver();
    document.getElementById("lovId").value = "";
    document.getElementById("fieldName").value = "";
    document.getElementById("optionValue").value = "";
    clear_msgs();
    set_mode('New', true);
    document.getElementById("lovId").oninput = function () {
        if (find_clicked == true) {
            position = -1;
            record_id = document.getElementById("lovId").value.trim();
            if (record_id == "") {
                document.getElementById("fieldName").value = "";
                document.getElementById("optionValue").value = "";
                return;
            }
            search_record();
        }
    }
}
function clear_msgs() {
    document.getElementById("fieldNameMsg").innerHTML = "";
    document.getElementById("optionValueMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";
    document.getElementById("msg").className = "";
}
function set_mode(mode, force) {
    if (mode === 'Find' && find_clicked && !force) return;
    if (mode === 'New' && !find_clicked && !force) return;
    document.getElementById("lovId").value = "";
    document.getElementById("fieldName").value = "";
    document.getElementById("optionValue").value = "";
    clear_msgs();
    record_id = "";
    position = -1;
    if (mode === 'Find') {
        find_clicked = true;
        document.getElementById("findModeBtn").classList.add("active");
        document.getElementById("newModeBtn").classList.remove("active");
        document.getElementById("saveBtn").innerHTML = "Update";
        document.getElementById("nextBtn").style.display = "inline-block";
        document.getElementById("lovId").readOnly = false;
        document.getElementById("lovId").style.cursor = "text";
        document.getElementById("lovId").style.backgroundColor = "white";
        document.getElementById("lovId").focus();
    } else {
        find_clicked = false;
        document.getElementById("findModeBtn").classList.remove("active");
        document.getElementById("newModeBtn").classList.add("active");
        document.getElementById("saveBtn").innerHTML = "Save";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "inline-block";
        document.getElementById("lovId").readOnly = true;
        document.getElementById("lovId").style.cursor = "not-allowed";
        document.getElementById("lovId").style.backgroundColor = "#eee";
        set_next_id();
        document.getElementById("fieldName").focus();
    }
}
function save_data(successCallback) {
    var lovId = document.getElementById("lovId").value.trim();
    var fieldName = document.getElementById("fieldName").value.trim();
    var optionValue = document.getElementById("optionValue").value.trim();
    var status = (position >= 0 && lov_data[position]) ? (lov_data[position][5] || 'Y') : 'Y';
    clear_msgs();
    var has_error = false;
    if (fieldName == "") {
        document.getElementById("fieldNameMsg").innerHTML = "Required";
        has_error = true;
    }
    if (optionValue == "") {
        document.getElementById("optionValueMsg").innerHTML = "Required";
        has_error = true;
    }
    if (has_error) {
        if (successCallback) successCallback(false);
        return;
    }
    if (find_clicked && record_id == "") {
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Search record first";
        if (successCallback) successCallback(false);
        return;
    }
    var data = {
        id: record_id,
        lov_type: fieldName,
        lov_code: optionValue.substring(0, 50).toUpperCase(),
        lov_value: optionValue,
        is_active: status
    };
    fetch("/saveLOVMaster", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(function (response) {
            return response.text();
        })
        .then(function (reply) {
            if (reply.toLowerCase().includes("ora-") || reply.toLowerCase().includes("error") || reply.toLowerCase().includes("fail")) {
                document.getElementById("msg").className = "msg-error";
                document.getElementById("msg").innerHTML = "An error occurred while saving.";
                if (successCallback) successCallback(false);
                return;
            }
            document.getElementById("msg").className = "msg-success";
            document.getElementById("msg").innerHTML = find_clicked ? "Updated successfully" : "Saved successfully";
            if (find_clicked && position !== -1) {
                lov_data[position][1] = fieldName;
                lov_data[position][2] = optionValue.substring(0, 50).toUpperCase();
                lov_data[position][3] = optionValue;
                lov_data[position][5] = status;
            }
            get_lov_records();
            if (!find_clicked) {
                document.getElementById("lovId").value = "";
                document.getElementById("fieldName").value = "";
                document.getElementById("optionValue").value = "";
                record_id = "";
                position = -1;
                document.getElementById("findModeBtn").classList.remove("active");
                document.getElementById("newModeBtn").classList.add("active");
                document.getElementById("saveBtn").innerHTML = "Save";
                set_next_id();
            } else {
                document.getElementById("saveBtn").innerHTML = "Update";
            }
            if (successCallback) {
                successCallback(true);
            }
        })
        .catch(function (error) {
            console.error("Error:", error);
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "Failed to communicate with server.";
            if (successCallback) successCallback(false);
        });
}
function search_record() {
    var l_id = document.getElementById("lovId").value.trim();
    if (l_id == "") {
        document.getElementById("fieldName").value = "";
        document.getElementById("optionValue").value = "";
        record_id = "";
        position = -1;
        return;
    }
    var found = false;
    for (var i = 0; i < lov_data.length; i++) {
        if (lov_data[i][0] && lov_data[i][0].toString() === l_id) {
            position = i;
            record_id = lov_data[i][0];
            found = true;
            break;
        }
    }
    if (found == true) {
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    } else {
        document.getElementById("fieldName").value = "";
        document.getElementById("optionValue").value = "";
        record_id = l_id;
        position = -1;
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "No record found";
    }
}
function show_data() {
    if (position < 0 || position >= lov_data.length) return;
    record_id = lov_data[position][0];
    document.getElementById("lovId").value = lov_data[position][0];
    document.getElementById("fieldName").value = lov_data[position][1] || "";
    document.getElementById("optionValue").value = lov_data[position][3] || "";
    find_clicked = true;
    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("saveBtn").innerHTML = "Update";
    document.getElementById("nextBtn").style.display = "inline-block";
    clear_msgs();
}
function set_next_id() {
    var next_id = 1;
    if (lov_data.length > 0) {
        var max_id = 0;
        for (var i = 0; i < lov_data.length; i++) {
            var current_id = parseInt(lov_data[i][0]);
            if (!isNaN(current_id) && current_id > max_id) {
                max_id = current_id;
            }
        }
        next_id = max_id + 1;
    }
    document.getElementById("lovId").value = next_id;
}
function get_lov_records(callback) {
    fetch("/getAllLOVs")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            lov_data = data;
            if (find_clicked == false && record_id == "") {
                set_next_id();
            } else if (record_id != "") {
                for (var i = 0; i < lov_data.length; i++) {
                    if (lov_data[i][0] == record_id) {
                        position = i;
                        break;
                    }
                }
            }
            if (callback) callback();
        });
}
function checkDirtyState() {
    var fieldName = document.getElementById("fieldName").value.trim();
    var optionValue = document.getElementById("optionValue").value.trim();
    if (find_clicked == false && position == -1) {
        if (fieldName !== "" || optionValue !== "") {
            return "edit";
        }
        return false;
    }
    if (position >= 0 && position < lov_data.length) {
        var p = lov_data[position];
        var db_fieldName = p[1] != null ? p[1].toString() : "";
        var db_optionValue = p[3] != null ? p[3].toString() : "";
        if (fieldName !== db_fieldName || optionValue !== db_optionValue) {
            return "edit";
        }
    }
    return false;
}
function next_data() {
    navigateWithCheck(function () {
        if (lov_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
        if (position == -1) {
            position = 0;
        } else {
            if (position < lov_data.length - 1) {
                position = position + 1;
            } else {
                document.getElementById("msg").className = "msg-error";
                document.getElementById("msg").innerHTML = "No next record";
                return;
            }
        }
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    });
}
function previous_data() {
    navigateWithCheck(function () {
        if (lov_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
        if (position == -1) {
            position = lov_data.length - 1;
        } else {
            if (position > 0) {
                position = position - 1;
            } else {
                document.getElementById("msg").className = "msg-error";
                document.getElementById("msg").innerHTML = "No previous record";
                return;
            }
        }
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    });
}
function exit_page() {
    navigateWithCheck(function () {
        window.history.back();
    });
}
