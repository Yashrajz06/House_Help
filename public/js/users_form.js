var users_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;
window.onload = function () {
    get_users_data();
    get_lov_data();
    initMessageObserver();
    document.getElementById("userId").oninput = function () {
        if (find_clicked) {
            position = -1;
            record_id = "";
            search_record();
        }
    };
    document.getElementById("mobileNo").oninput = function () {
        var mobileVal = this.value.replace(/\D/g, '');
        this.value = mobileVal;
        document.getElementById("mobileNoMsg").innerHTML = "";
        if (mobileVal !== "" && mobileVal.length !== 10) {
            document.getElementById("mobileNoMsg").innerHTML = "Mobile number must be 10 digits";
        } else {
            validate_uniqueness('mobileNo', 3, 'mobileNoMsg', 'Mobile number already exists');
        }
    };
    document.getElementById("email").oninput = function () {
        var emailVal = this.value.trim();
        document.getElementById("emailMsg").innerHTML = "";
        if (emailVal !== "" && !isValidEmail(emailVal)) {
            document.getElementById("emailMsg").innerHTML = "Invalid email format";
        } else {
            validate_uniqueness('email', 4, 'emailMsg', 'Email already exists');
        }
    };
    set_mode('New', true);
};
function setDropdownValue(field, val) {
    document.getElementById(field).value = val;
    var display = document.getElementById(field + "_display");
    if (display) display.value = val;
}
function showMsg(type, text) {
    var msg = document.getElementById("msg");
    msg.className = type ? "msg-" + type : "";
    msg.innerHTML = text;
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function mapActiveValue(val) {
    if (val === 1 || val === "1") return "Active";
    if (val === 0 || val === "0") return "Inactive";
    return val || "";
}
function decodePassword(hash) {
    if (!hash) return "";
    try {
        return atob(hash);
    } catch (e) {
        return hash;
    }
}
function enterFindModeUI() {
    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("saveBtn").innerHTML = "Update";
    document.getElementById("nextBtn").style.display = "inline-block";
    document.getElementById("userId").readOnly = false;
    document.getElementById("userId").style.cursor = "text";
    document.getElementById("userId").style.backgroundColor = "white";
}
function clear_fields() {
    document.getElementById("userId").value = "";
    document.getElementById("fullName").value = "";
    setDropdownValue("userType", "");
    document.getElementById("mobileNo").value = "";
    document.getElementById("email").value = "";
    document.getElementById("passwordHash").value = "";
    document.getElementById("passwordHash").type = "password";
    document.getElementById("passwordHash").readOnly = false;
    document.getElementById("passwordHash").style.backgroundColor = "white";
    document.getElementById("passwordHash").style.cursor = "text";
    resetPasswordIcon();
}
function clear_msgs() {
    document.getElementById("fullNameMsg").innerHTML = "";
    document.getElementById("userTypeMsg").innerHTML = "";
    document.getElementById("mobileNoMsg").innerHTML = "";
    document.getElementById("emailMsg").innerHTML = "";
    document.getElementById("passwordHashMsg").innerHTML = "";
    document.getElementById("isActiveMsg").innerHTML = "";
    showMsg("", "");
}
function set_mode(mode, force) {
    if (!force && mode === 'Find' && find_clicked) return;
    if (!force && mode === 'New' && !find_clicked) return;
    clear_fields();
    setDropdownValue("isActive", mode === 'Find' ? "" : "Active");
    clear_msgs();
    record_id = "";
    position = -1;
    if (mode === 'Find') {
        find_clicked = true;
        enterFindModeUI();
        document.getElementById("userId").focus();
    } else {
        find_clicked = false;
        document.getElementById("findModeBtn").classList.remove("active");
        document.getElementById("newModeBtn").classList.add("active");
        document.getElementById("saveBtn").innerHTML = "Save";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "inline-block";
        document.getElementById("userId").readOnly = true;
        document.getElementById("userId").style.cursor = "not-allowed";
        document.getElementById("userId").style.backgroundColor = "#eee";
        set_next_id();
        document.getElementById("fullName").focus();
    }
}
function search_record() {
    var searchId = document.getElementById("userId").value.trim();
    if (searchId == "") {
        clear_fields();
        setDropdownValue("isActive", "");
        record_id = "";
        position = -1;
        return;
    }
    var found = false;
    for (var i = 0; i < users_data.length; i++) {
        if (users_data[i][0] && users_data[i][0].toString() == searchId) {
            position = i;
            record_id = users_data[i][0];
            found = true;
            break;
        }
    }
    if (found) {
        show_data();
        showMsg("", "");
    } else {
        clear_fields();
        document.getElementById("userId").value = searchId;
        setDropdownValue("isActive", "");
        record_id = "";
        position = -1;
        showMsg("error", "Record Not found");
    }
}
function next_data() {
    navigateWithCheck(function () {
        if (users_data.length == 0) {
            showMsg("error", "No next record");
            return;
        }
        if (position == -1) {
            position = 0;
        } else if (position < users_data.length - 1) {
            position = position + 1;
        } else {
            showMsg("error", "No next record");
            return;
        }
        show_data();
        showMsg("", "");
    });
}
function previous_data() {
    navigateWithCheck(function () {
        if (users_data.length == 0) {
            showMsg("error", "No previous record");
            return;
        }
        if (position == -1) {
            position = users_data.length - 1;
        } else if (position > 0) {
            position = position - 1;
        } else {
            showMsg("error", "No previous record");
            return;
        }
        show_data();
        showMsg("", "");
    });
}
function show_data() {
    if (position < 0 || position >= users_data.length) return;
    record_id = users_data[position][0];
    document.getElementById("userId").value = record_id;
    setDropdownValue("userType", users_data[position][1] || "");
    document.getElementById("fullName").value = users_data[position][2] || "";
    document.getElementById("mobileNo").value = users_data[position][3] || "";
    document.getElementById("email").value = users_data[position][4] || "";
    document.getElementById("passwordHash").value = decodePassword(users_data[position][5]);
    setDropdownValue("isActive", mapActiveValue(users_data[position][6]));
    find_clicked = true;
    enterFindModeUI();
    document.getElementById("passwordHash").readOnly = true;
    document.getElementById("passwordHash").style.backgroundColor = "#eee";
    document.getElementById("passwordHash").style.cursor = "not-allowed";
    clear_msgs();
}
function set_next_id() {
    var max_id = 0;
    for (var i = 0; i < users_data.length; i++) {
        var current_id = parseInt(users_data[i][0]);
        if (!isNaN(current_id) && current_id > max_id) max_id = current_id;
    }
    document.getElementById("userId").value = max_id + 1;
}
function get_users_data() {
    fetch("/getUsers")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            users_data = data;
            if (!find_clicked && record_id == "") {
                set_next_id();
            } else if (record_id != "") {
                for (var i = 0; i < users_data.length; i++) {
                    if (users_data[i][0] == record_id) { position = i; break; }
                }
            }
        })
        .catch(function () {
            showMsg("error", "Unable to load records");
        });
}
function get_lov_data() {
    fetch("/getAllLOVs")
        .then(function(response) { return response.json(); })
        .then(function(data) {
            var userTypeTbody = document.getElementById("table_userType").getElementsByTagName("tbody")[0];
            userTypeTbody.innerHTML = "";
            var isActiveTbody = document.getElementById("table_isActive").getElementsByTagName("tbody")[0];
            isActiveTbody.innerHTML = "";
            data.forEach(function(row) {
                if (row[5] === 'Y' || row[5] === 1) { 
                    if (row[1] === "USER_TYPE") {
                        var tr = document.createElement("tr");
                        tr.innerHTML = `<td>${row[3]}</td>`;
                        tr.onclick = function() {
                            setDropdownValue("userType", row[3]);
                        };
                        userTypeTbody.appendChild(tr);
                    } else if (row[1] === "USER_STATUS") {
                        var tr = document.createElement("tr");
                        tr.innerHTML = `<td>${row[3]}</td>`;
                        tr.onclick = function() {
                            setDropdownValue("isActive", row[3]);
                        };
                        isActiveTbody.appendChild(tr);
                    }
                }
            });
        })
        .catch(function(err) { console.error("Error loading LOV data", err); });
}
function exit_page() {
    navigateWithCheck(function() {
        window.location.href = "http://localhost:5173/";
    });
}
function save_data(successCallback) {
    var userId = document.getElementById("userId").value.trim();
    var fullName = document.getElementById("fullName").value.trim();
    var userType = document.getElementById("userType").value.trim();
    var mobileNo = document.getElementById("mobileNo").value.trim();
    var email = document.getElementById("email").value.trim();
    var passwordHash = document.getElementById("passwordHash").value.trim();
    var isActive = document.getElementById("isActive").value.trim();
    var isValid = true;
    if (fullName === "") { document.getElementById("fullNameMsg").innerHTML = "Full Name is required"; isValid = false; }
    if (userType === "") { document.getElementById("userTypeMsg").innerHTML = "User Type is required"; isValid = false; }
    if (mobileNo === "") { document.getElementById("mobileNoMsg").innerHTML = "Mobile No is required"; isValid = false; }
    if (email === "") { document.getElementById("emailMsg").innerHTML = "Email is required"; isValid = false; }
    if (passwordHash === "") { document.getElementById("passwordHashMsg").innerHTML = "Password is required"; isValid = false; }
    if (isActive === "") { document.getElementById("isActiveMsg").innerHTML = "Status is required"; isValid = false; }
    if (mobileNo !== "" && mobileNo.length !== 10) isValid = false;
    if (email !== "" && !isValidEmail(email)) isValid = false;
    if (document.getElementById("mobileNoMsg").innerHTML !== "") isValid = false;
    if (document.getElementById("emailMsg").innerHTML !== "") isValid = false;
    if (!isValid) {
        showMsg("error", "Please fix validation errors");
        return;
    }
    var payload = {
        id: find_clicked ? userId : null,
        user_type: userType,
        full_name: fullName,
        mobile_no: mobileNo,
        email: email,
        password_hash: btoa(passwordHash),
        is_active: isActive
    };
    fetch("/saveUser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(function(response) { return response.text(); })
    .then(function(msg) {
        showMsg("success", msg);
        get_users_data();
        if (!find_clicked) {
            set_mode("New", true);
        } else {
            for (var i = 0; i < users_data.length; i++) {
                if (users_data[i][0] == userId) {
                    users_data[i][1] = userType;
                    users_data[i][2] = fullName;
                    users_data[i][3] = mobileNo;
                    users_data[i][4] = email;
                    users_data[i][5] = btoa(passwordHash);
                    users_data[i][6] = isActive;
                    break;
                }
            }
        }
    })
    .catch(function(err) {
        showMsg("error", "Error saving data");
        console.error(err);
    });
}
