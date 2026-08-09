var category_map = {};
var customer_map = {};
var provider_map = {};
var bookings_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;
window.onload = function () {
    get_bookings_data();
    get_dropdowns_data();
    initMessageObserver();
    document.getElementById("bookingId").oninput = function () {
        if (find_clicked) {
            position = -1;
            record_id = document.getElementById("bookingId").value.trim();
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
    document.getElementById("bookingId").value = "";
    document.getElementById("categoryId").value = "";
    if(document.getElementById("categoryId_display")) document.getElementById("categoryId_display").value = "";
    document.getElementById("customerId").value = "";
    if(document.getElementById("customerId_display")) document.getElementById("customerId_display").value = "";
    document.getElementById("providerId").value = "";
    if(document.getElementById("providerId_display")) document.getElementById("providerId_display").value = "";
    document.getElementById("serviceDate").value = "";
    document.getElementById("bookingStatus").value = "";
    if(document.getElementById("bookingStatus_display")) document.getElementById("bookingStatus_display").value = "";
    document.getElementById("address").value = "";
}
function clear_msgs() {
    document.getElementById("categoryIdMsg").innerHTML = "";
    document.getElementById("customerIdMsg").innerHTML = "";
    document.getElementById("providerIdMsg").innerHTML = "";
    document.getElementById("serviceDateMsg").innerHTML = "";
    document.getElementById("bookingStatusMsg").innerHTML = "";
    document.getElementById("addressMsg").innerHTML = "";
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
        document.getElementById("bookingId").readOnly = false;
        document.getElementById("bookingId").style.cursor = "text";
        document.getElementById("bookingId").style.backgroundColor = "white";
        document.getElementById("bookingId").focus();
    } else {
        find_clicked = false;
        document.getElementById("findModeBtn").classList.remove("active");
        document.getElementById("newModeBtn").classList.add("active");
        document.getElementById("saveBtn").innerHTML = "Save";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("prevBtn").style.display = "inline-block";
        document.getElementById("bookingId").readOnly = true;
        document.getElementById("bookingId").style.cursor = "not-allowed";
        document.getElementById("bookingId").style.backgroundColor = "#eee";
        set_next_id();
        document.getElementById("categoryId_display").focus();
    }
}
function format_datetime_local(val) {
    if (!val) return "";
    var s = val.toString();
    if (s.length >= 16) return s.substring(0, 16);
    return s;
}
function save_data(successCallback) {
    var categoryId = document.getElementById("categoryId").value.trim();
    var customerId = document.getElementById("customerId").value.trim();
    var providerId = document.getElementById("providerId").value.trim();
    var serviceDate = document.getElementById("serviceDate").value.trim();
    var bookingStatus = document.getElementById("bookingStatus").value.trim();
    var address = document.getElementById("address").value.trim();
    clear_msgs();
    var has_error = false;
    if (categoryId == "") { document.getElementById("categoryIdMsg").innerHTML = "Required"; has_error = true; }
    if (customerId == "") { document.getElementById("customerIdMsg").innerHTML = "Required"; has_error = true; }
    if (providerId == "") { document.getElementById("providerIdMsg").innerHTML = "Required"; has_error = true; }
    if (serviceDate == "") { document.getElementById("serviceDateMsg").innerHTML = "Required"; has_error = true; }
    if (bookingStatus == "") { document.getElementById("bookingStatusMsg").innerHTML = "Required"; has_error = true; }
    if (address == "") { document.getElementById("addressMsg").innerHTML = "Required"; has_error = true; }
    if (has_error) return false;
    if (find_clicked && record_id == "") {
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Search record first";
        return false;
    }
    var data = { 
        id: record_id || null, 
        category_id: categoryId, 
        customer_id: customerId, 
        provider_id: providerId, 
        service_date: serviceDate, 
        booking_status: bookingStatus, 
        address: address 
    };
    fetch("/saveBooking", {
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
                bookings_data[position][1] = customerId;
                bookings_data[position][2] = providerId;
                bookings_data[position][3] = categoryId;
                bookings_data[position][4] = serviceDate;
                bookings_data[position][5] = bookingStatus;
                bookings_data[position][6] = address;
            }
            get_bookings_data();
            if (!find_clicked) {
                clear_fields();
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
    var searchId = document.getElementById("bookingId").value.trim();
    if (searchId == "") {
        clear_fields();
        record_id = "";
        position = -1;
        return;
    }
    var found = false;
    for (var i = 0; i < bookings_data.length; i++) {
        if (bookings_data[i][0] && bookings_data[i][0].toString() == searchId) {
            position = i;
            record_id = bookings_data[i][0];
            found = true;
            break;
        }
    }
    if (found) {
        show_data();
        document.getElementById("msg").innerHTML = "";
        document.getElementById("msg").className = "";
    } else {
        document.getElementById("categoryId").value = "";
        if(document.getElementById("categoryId_display")) document.getElementById("categoryId_display").value = "";
        document.getElementById("customerId").value = "";
        if(document.getElementById("customerId_display")) document.getElementById("customerId_display").value = "";
        document.getElementById("providerId").value = "";
        if(document.getElementById("providerId_display")) document.getElementById("providerId_display").value = "";
        document.getElementById("serviceDate").value = "";
        document.getElementById("bookingStatus").value = "";
        if(document.getElementById("bookingStatus_display")) document.getElementById("bookingStatus_display").value = "";
        document.getElementById("address").value = "";
        record_id = searchId;
        position = -1;
        document.getElementById("msg").className = "msg-error";
        document.getElementById("msg").innerHTML = "Record Not found";
    }
}
function next_data() {
    navigateWithCheck(function () {
        if (bookings_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
        if (position == -1) { position = 0; }
        else if (position < bookings_data.length - 1) { position = position + 1; }
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
        if (bookings_data.length == 0) {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
        if (position == -1) { position = bookings_data.length - 1; }
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
    if (position < 0 || position >= bookings_data.length) return;
    record_id = bookings_data[position][0];
    document.getElementById("bookingId").value = record_id;
    var custId = bookings_data[position][1] || "";
    document.getElementById("customerId").value = custId;
    if (document.getElementById("customerId_display")) {
        document.getElementById("customerId_display").value = customer_map[custId] || custId;
    }
    var provId = bookings_data[position][2] || "";
    document.getElementById("providerId").value = provId;
    if (document.getElementById("providerId_display")) {
        document.getElementById("providerId_display").value = provider_map[provId] || provId;
    }
    var catId = bookings_data[position][3] || "";
    document.getElementById("categoryId").value = catId;
    if (document.getElementById("categoryId_display")) {
        document.getElementById("categoryId_display").value = category_map[catId] || catId;
    }
    document.getElementById("serviceDate").value = format_datetime_local(bookings_data[position][4]);
    var statusVal = bookings_data[position][5] || "";
    document.getElementById("bookingStatus").value = statusVal;
    if (document.getElementById("bookingStatus_display")) {
        document.getElementById("bookingStatus_display").value = statusVal;
    }
    document.getElementById("address").value = bookings_data[position][6] || "";
    find_clicked = true;
    document.getElementById("findModeBtn").classList.add("active");
    document.getElementById("newModeBtn").classList.remove("active");
    document.getElementById("saveBtn").innerHTML = "Update";
    document.getElementById("nextBtn").style.display = "inline-block";
    document.getElementById("bookingId").readOnly = false;
    document.getElementById("bookingId").style.cursor = "text";
    document.getElementById("bookingId").style.backgroundColor = "white";
    clear_msgs();
}
function set_next_id() {
    var max_id = 0;
    for (var i = 0; i < bookings_data.length; i++) {
        var current_id = parseInt(bookings_data[i][0]);
        if (!isNaN(current_id) && current_id > max_id) max_id = current_id;
    }
    document.getElementById("bookingId").value = max_id + 1;
}
function get_bookings_data() {
    fetch("/getBookings")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            bookings_data = data;
            if (!find_clicked && record_id == "") {
                set_next_id();
            } else if (record_id != "") {
                for (var i = 0; i < bookings_data.length; i++) {
                    if (bookings_data[i][0] == record_id) { position = i; break; }
                }
            }
        })
        .catch(function () {
            document.getElementById("msg").className = "msg-error";
            document.getElementById("msg").innerHTML = "Unable to load records";
        });
}
function get_dropdowns_data() {
    fetch("/getDropdowns")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            var catTbody = document.querySelector("#table_categoryId tbody");
            if (catTbody) catTbody.innerHTML = '';
            for (var i = 0; i < data.categories.length; i++) {
                var id = data.categories[i][0];
                var name = data.categories[i][1] || "";
                var display = id + " - " + name;
                category_map[id] = display;
                var tr = document.createElement("tr");
                tr.innerHTML = "<td>" + id + "</td><td>" + name + "</td>";
                tr.onclick = (function(v, d) {
                    return function() { selectOption("categoryId", v, d); };
                })(id, display);
                if (catTbody) catTbody.appendChild(tr);
            }
            var custTbody = document.querySelector("#table_customerId tbody");
            if (custTbody) custTbody.innerHTML = '';
            for (var i = 0; i < data.customers.length; i++) {
                var id = data.customers[i][0];
                var name = data.customers[i][1] || "";
                var display = name; // Only show the name when selected
                customer_map[id] = display;
                var tr = document.createElement("tr");
                tr.innerHTML = "<td>" + id + "</td><td>" + name + "</td>";
                tr.onclick = (function(v, d) {
                    return function() { selectOption("customerId", v, d); };
                })(id, display);
                if (custTbody) custTbody.appendChild(tr);
            }
            var provTbody = document.querySelector("#table_providerId tbody");
            if (provTbody) provTbody.innerHTML = '';
            for (var i = 0; i < data.providers.length; i++) {
                var id = data.providers[i][0];
                var name = data.providers[i][1] || "";
                var display = id + " - " + name;
                provider_map[id] = display;
                var tr = document.createElement("tr");
                tr.innerHTML = "<td>" + id + "</td><td>" + name + "</td>";
                tr.onclick = (function(v, d) {
                    return function() { selectOption("providerId", v, d); };
                })(id, display);
                if (provTbody) provTbody.appendChild(tr);
            }
            var statusTbody = document.querySelector("#table_bookingStatus tbody");
            if (statusTbody) statusTbody.innerHTML = '';
            for (var i = 0; i < data.statuses.length; i++) {
                var val = data.statuses[i];
                var tr = document.createElement("tr");
                tr.innerHTML = "<td>" + val + "</td>";
                tr.onclick = (function(v) {
                    return function() { selectOption("bookingStatus", v, v); };
                })(val);
                if (statusTbody) statusTbody.appendChild(tr);
            }
        })
        .catch(function(err) { console.error("Error loading dropdown data", err); });
}
function exit_page() {
    navigateWithCheck(function () { window.location.href = "http://localhost:5173/"; });
}
function checkDirtyState() {
    var categoryId = document.getElementById("categoryId").value.trim();
    var customerId = document.getElementById("customerId").value.trim();
    var providerId = document.getElementById("providerId").value.trim();
    var serviceDate = format_datetime_local(document.getElementById("serviceDate").value.trim());
    var bookingStatus = document.getElementById("bookingStatus").value.trim();
    var address = document.getElementById("address").value.trim();
    if (find_clicked == false && position == -1) {
        if (categoryId !== "" || customerId !== "" || providerId !== "" || serviceDate !== "" || bookingStatus !== "" || address !== "") {
            return "edit";
        }
        return false;
    }
    if (position >= 0 && position < bookings_data.length) {
        var p = bookings_data[position];
        if (customerId !== (p[1] != null ? p[1].toString().trim() : "") ||
            providerId !== (p[2] != null ? p[2].toString().trim() : "") ||
            categoryId !== (p[3] != null ? p[3].toString().trim() : "") ||
            serviceDate !== format_datetime_local(p[4]) ||
            bookingStatus !== (p[5] != null ? p[5].toString().trim() : "") ||
            address !== (p[6] != null ? p[6].toString().trim() : "")) {
            return "edit";
        }
    }
    return false;
}
