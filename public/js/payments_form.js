var booking_map = {};
var booking_details_map = {};
var payments_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;
function get_today() {
    var d = new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}
window.onload = function () {
    get_payments_data();
    get_lov_data();
    get_bookings_data();
    initMessageObserver();
    document.getElementById("paymentId").oninput = function () {
        if (find_clicked) {
            position = -1;
            record_id = document.getElementById("paymentId").value.trim();
            if (record_id === "") { clear_fields(); return; }
            search_record();
        }
    };
    set_mode('New', true);
};
function clear_fields() {
    document.getElementById("paymentId").value = "";
    document.getElementById("bookingId").value = "";
    if (document.getElementById("bookingId_display")) document.getElementById("bookingId_display").value = "";
    document.getElementById("customerName").value = "";
    document.getElementById("providerName").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("paymentMode").value = "";
    if (document.getElementById("paymentMode_display")) document.getElementById("paymentMode_display").value = "";
    document.getElementById("paymentStatus").value = "";
    if (document.getElementById("paymentStatus_display")) document.getElementById("paymentStatus_display").value = "";
    document.getElementById("paymentDate").value = "";
}
function clear_msgs() {
    document.getElementById("bookingIdMsg").innerHTML = "";
    document.getElementById("amountMsg").innerHTML = "";
    document.getElementById("paymentModeMsg").innerHTML = "";
    document.getElementById("paymentStatusMsg").innerHTML = "";
    document.getElementById("paymentDateMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";
    document.getElementById("msg").className = "";
}
function set_mode(mode, force) {
    if (!force && mode === 'Find' && find_clicked) return;
    if (!force && mode === 'New' && !find_clicked) return;
    clear_fields();
    clear_msgs();
    record_id = "";
    position = -1;
    if (mode === 'Find') {
        find_clicked = true;
        document.getElementById("findModeBtn").classList.add("active");
        document.getElementById("newModeBtn").classList.remove("active");
        document.getElementById("saveBtn").innerHTML = "Update";
        document.getElementById("nextBtn").style.display = "inline-block";
        document.getElementById("paymentId").readOnly = false;
        document.getElementById("paymentId").style.cursor = "text";
        document.getElementById("paymentId").style.backgroundColor = "white";
        document.getElementById("paymentId").focus();
    } else {
        find_clicked = false;
        document.getElementById("findModeBtn").classList.remove("active");
        document.getElementById("newModeBtn").classList.add("active");
        document.getElementById("saveBtn").innerHTML = "Save";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "inline-block";
        document.getElementById("paymentId").readOnly = true;
        document.getElementById("paymentId").style.cursor = "not-allowed";
        document.getElementById("paymentId").style.backgroundColor = "#eee";
        set_next_id();
        document.getElementById("paymentDate").value = get_today();
        document.getElementById("amount").focus();
    }
}
function save_data(successCallback) {
    var bookingId = document.getElementById("bookingId").value.trim();
    var amount = document.getElementById("amount").value.trim();
    var paymentMode = document.getElementById("paymentMode").value.trim();
    var paymentStatus = document.getElementById("paymentStatus").value.trim();
    var paymentDate = document.getElementById("paymentDate").value.trim();
    clear_msgs();
    var has_error = false;
    if (amount === "" || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
        document.getElementById("amountMsg").innerHTML = "Required (must be a positive number)";
        has_error = true;
    }
    if (paymentMode === "") { document.getElementById("paymentModeMsg").innerHTML = "Required"; has_error = true; }
    if (paymentStatus === "") { document.getElementById("paymentStatusMsg").innerHTML = "Required"; has_error = true; }
    if (has_error) return false;
    if (find_clicked && record_id === "") {
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Search record first";
        return false;
    }
    var data = {
        id: record_id,
        booking_id: bookingId || null,
        amount: parseFloat(amount),
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        payment_date: paymentDate || null
    };
    fetch("/savePayment", {
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
                payments_data[position][1] = bookingId || null;
                payments_data[position][2] = parseFloat(amount);
                payments_data[position][3] = paymentMode;
                payments_data[position][4] = paymentStatus;
                payments_data[position][5] = paymentDate || null;
            }
            get_payments_data();
            if (!find_clicked) {
                clear_fields();
                document.getElementById("paymentDate").value = get_today();
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
    var searchId = document.getElementById("paymentId").value.trim();
    if (searchId === "") {
        clear_fields();
        record_id = "";
        position = -1;
        return;
    }
    var found = false;
    for (var i = 0; i < payments_data.length; i++) {
        if (payments_data[i][0] && payments_data[i][0].toString() === searchId) {
            position = i;
            record_id = payments_data[i][0];
            found = true;
            break;
        }
    }
    if (found) {
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    } else {
        clear_fields();
        document.getElementById("paymentId").value = searchId;
        record_id = searchId;
        position = -1;
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Record Not found";
    }
}
function next_data() {
    navigateWithCheck(function () {
        if (payments_data.length === 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
        if (position === -1) { position = 0; }
        else if (position < payments_data.length - 1) { position = position + 1; }
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
        if (payments_data.length === 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
        if (position === -1) { position = payments_data.length - 1; }
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
    return s;
}
function show_data() {
    if (position < 0 || position >= payments_data.length) return;
    var p = payments_data[position];
    record_id = p[0];
    document.getElementById("paymentId").value = record_id;
    var bid = p[1] || "";
    document.getElementById("bookingId").value = bid;
    if (document.getElementById("bookingId_display")) {
        document.getElementById("bookingId_display").value = bid;
    }
    document.getElementById("customerName").value = booking_details_map[bid] ? booking_details_map[bid].customer : "";
    document.getElementById("providerName").value = booking_details_map[bid] ? booking_details_map[bid].provider : "";
    document.getElementById("amount").value = p[2] != null ? p[2] : "";
    document.getElementById("paymentMode").value = p[3] || "";
    if (document.getElementById("paymentMode_display")) document.getElementById("paymentMode_display").value = p[3] || "";
    document.getElementById("paymentStatus").value = p[4] || "";
    if (document.getElementById("paymentStatus_display")) document.getElementById("paymentStatus_display").value = p[4] || "";
    document.getElementById("paymentDate").value = format_date(p[5]);
    find_clicked = true;
    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("saveBtn").innerHTML = "Update";
    document.getElementById("nextBtn").style.display = "inline-block";
    document.getElementById("paymentId").readOnly = false;
    document.getElementById("paymentId").style.cursor = "text";
    document.getElementById("paymentId").style.backgroundColor = "white";
    clear_msgs();
}
function set_next_id() {
    var max_id = 0;
    for (var i = 0; i < payments_data.length; i++) {
        var cid = parseInt(payments_data[i][0]);
        if (!isNaN(cid) && cid > max_id) max_id = cid;
    }
    document.getElementById("paymentId").value = max_id + 1;
}
function get_payments_data() {
    fetch("/getPayments")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            payments_data = data;
            if (!find_clicked && record_id === "") {
                set_next_id();
            } else if (record_id !== "") {
                for (var i = 0; i < payments_data.length; i++) {
                    if (payments_data[i][0] == record_id) { position = i; break; }
                }
            }
        })
        .catch(function () {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "Unable to load records";
        });
}
function get_bookings_data() {
    fetch("/getBookings")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            var tbody = document.querySelector("#table_bookingId tbody");
            if (!tbody) return;
            tbody.innerHTML = "";
            booking_map = {};
            booking_details_map = {};
            for (var i = 0; i < data.length; i++) {
                var bid = data[i][0];
                var cid = data[i][1] || "";
                var pid = data[i][2] || "";
                var c_name = data[i][7] || "";
                var p_name = data[i][8] || "";
                var display = bid; // Only show Booking ID when selected
                booking_map[bid] = display;
                booking_details_map[bid] = { customer: c_name, provider: p_name };
                var tr = document.createElement("tr");
                tr.innerHTML = "<td>" + bid + "</td><td>" + cid + "</td><td>" + c_name + "</td><td>" + pid + "</td><td>" + p_name + "</td>";
                tr.onclick = (function (v, d, c, p) {
                    return function () { 
                        selectOption("bookingId", v, d);
                        document.getElementById("customerName").value = c;
                        document.getElementById("providerName").value = p;
                    };
                })(bid, display, c_name, p_name);
                tbody.appendChild(tr);
            }
        })
        .catch(function (err) { console.error("Error loading bookings", err); });
}
function get_lov_data() {
    fetch("/getLOV")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            var modeTbody = document.querySelector("#table_paymentMode tbody");
            var statusTbody = document.querySelector("#table_paymentStatus tbody");
            if (modeTbody) modeTbody.innerHTML = "";
            if (statusTbody) statusTbody.innerHTML = "";
            for (var i = 0; i < data.length; i++) {
                var lovType = data[i][0];
                var lovValue = data[i][2];
                if (lovType === "PAYMENT_MODE" && modeTbody) {
                    var tr = document.createElement("tr");
                    tr.innerHTML = "<td>" + lovValue + "</td>";
                    tr.onclick = (function (val) {
                        return function () { selectOption("paymentMode", val, val); };
                    })(lovValue);
                    modeTbody.appendChild(tr);
                }
                if (lovType === "PAYMENT_STATUS" && statusTbody) {
                    var tr2 = document.createElement("tr");
                    tr2.innerHTML = "<td>" + lovValue + "</td>";
                    tr2.onclick = (function (val) {
                        return function () { selectOption("paymentStatus", val, val); };
                    })(lovValue);
                    statusTbody.appendChild(tr2);
                }
            }
            if (!find_clicked) {
                document.getElementById("paymentStatus").value = "Pending";
                if (document.getElementById("paymentStatus_display")) document.getElementById("paymentStatus_display").value = "Pending";
            }
        });
}
function exit_page() {
    navigateWithCheck(function () { window.location.href = "http://localhost:5173/"; });
}
function checkDirtyState() {
    var bookingId = document.getElementById("bookingId").value.trim();
    var amount = document.getElementById("amount").value.trim();
    var paymentMode = document.getElementById("paymentMode").value.trim();
    var paymentStatus = document.getElementById("paymentStatus").value.trim();
    var paymentDate = document.getElementById("paymentDate").value.trim();
    if (find_clicked === false && position === -1) {
        if (bookingId !== "" || amount !== "" || paymentMode !== "" ||
            (paymentStatus !== "" && paymentStatus !== "Pending") || paymentDate !== get_today()) {
            return "edit";
        }
        return false;
    }
    if (position >= 0 && position < payments_data.length) {
        var p = payments_data[position];
        var dbDate = format_date(p[5]);
        var dbAmount = p[2] != null ? p[2].toString() : "";
        if (bookingId !== (p[1] != null ? p[1].toString().trim() : "") ||
            amount !== dbAmount ||
            paymentMode !== (p[3] != null ? p[3].toString().trim() : "") ||
            paymentStatus !== (p[4] != null ? p[4].toString().trim() : "") ||
            paymentDate !== dbDate) {
            return "edit";
        }
    }
    return false;
}
