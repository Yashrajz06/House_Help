let modalOverlay = null;

function showModal({ title, message, buttons = [{ text: "OK", class: "primary", value: "ok" }] }) {
    return new Promise((resolve) => {
        if (!modalOverlay) {
            modalOverlay = document.createElement("div");
            modalOverlay.className = "modal-overlay";
            document.body.appendChild(modalOverlay);
        }

        const actionsHtml = buttons.map((btn, idx) => {
            let btnClass = "modal-btn-secondary";
            if (btn.class === "primary" || btn.class === "success") btnClass = "modal-btn-primary";
            if (btn.class === "neutral") btnClass = "modal-btn-neutral";
            return `<button class="modal-btn ${btnClass}" data-index="${idx}">${btn.text}</button>`;
        }).join("");

        modalOverlay.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;

        setTimeout(() => {
            modalOverlay.classList.add("show");
        }, 10);

        const actionButtons = modalOverlay.querySelectorAll(".modal-btn");
        actionButtons.forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-index"));
                const value = buttons[idx].value;
                modalOverlay.classList.remove("show");
                setTimeout(() => {
                    resolve(value);
                }, 200);
            };
        });
    });
}

const messageBox = document.getElementById("messageBox");

function showMessage(message, type) {
    if (!messageBox) return;
    messageBox.innerText = message;
    messageBox.className = "message-box " + type + " show";

    clearTimeout(messageBox.timer);
    messageBox.timer = setTimeout(() => {
        messageBox.className = "message-box";
    }, 5000);
}

function hideMessage() {
    if (!messageBox) return;
    clearTimeout(messageBox.timer);
    messageBox.className = "message-box";
    messageBox.innerText = "";
}


const reviewIdInput = document.getElementById("review_id");
const bookingIdInput = document.getElementById("booking_id");
const customerIdInput = document.getElementById("customer_id");
const providerIdInput = document.getElementById("provider_id");
const ratingInput = (() => {
    const el = document.getElementById("rating");
    return {
        get value() { return el.value; },
        set value(val) {
            el.value = val;
            updateStarUI(val);
        },
        get selectedIndex() { return el.selectedIndex; },
        set selectedIndex(idx) {
            el.selectedIndex = idx;
            updateStarUI(el.value);
        },
        focus() {
            const container = document.getElementById("starRatingContainer");
            if (container) container.focus();
        },
        get innerHTML() { return el.innerHTML; },
        set innerHTML(html) { el.innerHTML = html; }
    };
})();
const reviewTextInput = document.getElementById("review_text");

const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const exitBtn = document.getElementById("exitBtn");
const findBtn = document.getElementById("findBtn");

const confirmBox = document.getElementById("confirmBox");
const yesExit = document.getElementById("yesExit");
const noExit = document.getElementById("noExit");


let reviews = [];
let currentIndex = -1;
let fetchPromise = null;
let originalRecord = null;
let isFetchingNextId = false;
let isAutoFilling = false;
let searchAbortController = null;
let lastSearchedId = "";


async function fetchReviews() {
    try {
        const response = await fetch("http://localhost:5000/reviews");
        const data = await response.json();
        
        reviews = data;
        reviews.sort((a, b) => Number(a[0]) - Number(b[0]));
    } catch (err) {
        console.error("Error loading reviews list:", err);
    }
}

function getFormattedCustomerId(id) {
    if (id === null || id === undefined) return "";
    const cid = String(id).trim();
    if (cid === "") return "";
    const customer = customers.find(c => String(c.customer_id) === cid);
    if (customer && customer.customer_name) {
        return `${cid} - ${customer.customer_name}`;
    }
    return cid;
}

function getFormattedProviderId(id) {
    if (id === null || id === undefined) return "";
    const pid = String(id).trim();
    if (pid === "") return "";
    const provider = providers.find(p => String(p.provider_id) === pid);
    if (provider && provider.provider_name) {
        return `${pid} - ${provider.provider_name}`;
    }
    return pid;
}

function getFormattedBookingId(id) {
    if (id === null || id === undefined) return "";
    const bid = String(id).trim();
    if (bid === "") return "";
    const booking = bookings.find(b => String(b.booking_id) === bid);
    if (booking && booking.category_name) {
        return `${bid} - ${booking.category_name}`;
    }
    return bid;
}


function displayReview(reviewRow) {
    if (!reviewRow) return;

    reviewIdInput.readOnly = false;
    reviewIdInput.removeAttribute("readonly");

    reviewIdInput.value = reviewRow[0]; 
    bookingIdInput.value = getFormattedBookingId(reviewRow[1] || ""); 
    customerIdInput.value = getFormattedCustomerId(reviewRow[2] || ""); 
    providerIdInput.value = getFormattedProviderId(reviewRow[3] || ""); 
    ratingInput.value = reviewRow[4] || ""; 
    reviewTextInput.value = reviewRow[5] || ""; 

    
    originalRecord = {
        review_id: String(reviewRow[0]),
        booking_id: String(reviewRow[1] || ""),
        customer_id: String(reviewRow[2] || ""),
        provider_id: String(reviewRow[3] || ""),
        rating: String(reviewRow[4] || ""),
        review_text: reviewRow[5] || ""
    };

    lastSearchedId = String(reviewRow[0]);
    if (findBtn) findBtn.innerText = "New";
}


function resetButtonState() {
    if (saveBtn) saveBtn.style.display = "inline-block";
    if (updateBtn) updateBtn.style.display = "none";
    if (prevBtn) prevBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "none";
}


function setFindButtonState() {
    if (saveBtn) saveBtn.style.display = "none";
    if (updateBtn) updateBtn.style.display = "inline-block";
    if (prevBtn) prevBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "inline-block";
}


function clearForm(shouldFocus = true) {
    if (searchAbortController) {
        searchAbortController.abort();
        searchAbortController = null;
    }
    reviewIdInput.readOnly = true;
    reviewIdInput.setAttribute("readonly", "readonly");
    reviewIdInput.value = "";
    bookingIdInput.value = "";
    customerIdInput.value = "";
    providerIdInput.value = "";
    ratingInput.selectedIndex = 0;
    reviewTextInput.value = "";
    originalRecord = null;
    currentIndex = -1;
    lastSearchedId = "";
    resetButtonState();
    if (shouldFocus) {
        reviewIdInput.focus();
    }
    if (findBtn) findBtn.innerText = "Find";

    
    fetchNextReviewId();
}


function findReviewIndex(id) {
    return reviews.findIndex(r => r[0] == id);
}

function updateStarUI(val) {
    const value = parseInt(val) || 0;
    const stars = document.querySelectorAll("#starRatingContainer .star-icon");
    stars.forEach(star => {
        const starVal = parseInt(star.getAttribute("data-value"));
        if (starVal <= value) {
            star.innerHTML = "&#9733;";
            star.classList.add("selected");
        } else {
            star.innerHTML = "&#9734;";
            star.classList.remove("selected");
        }
    });
}
function initStarRating() {
    const container = document.getElementById("starRatingContainer");
    if (!container) return;
    const stars = container.querySelectorAll(".star-icon");
    const realSelect = document.getElementById("rating");

    stars.forEach(star => {
        star.onmouseenter = () => {
            const hoverVal = parseInt(star.getAttribute("data-value"));
            stars.forEach(s => {
                const sVal = parseInt(s.getAttribute("data-value"));
                if (sVal <= hoverVal) {
                    s.innerHTML = "&#9733;";
                    s.classList.add("hover");
                } else {
                    s.innerHTML = "&#9734;";
                    s.classList.remove("hover");
                }
            });
        };

        star.onmouseleave = () => {
            stars.forEach(s => s.classList.remove("hover"));
            const currentVal = realSelect.value;
            updateStarUI(currentVal);
        };

        star.onclick = () => {
            const selectVal = star.getAttribute("data-value");
            ratingInput.value = selectVal;
        };
    });

    container.onmouseleave = () => {
        stars.forEach(s => s.classList.remove("hover"));
        const currentVal = realSelect.value;
        updateStarUI(currentVal);
    };
}

window.addEventListener("DOMContentLoaded", async () => {
    initStarRating();
    fetchPromise = fetchReviews();
    const bookingsPromise = fetchBookings();
    const customersPromise = fetchCustomers();
    const providersPromise = fetchProviders();
    const ratingPromise = fetchRatingLOV();

    await Promise.all([
        fetchPromise,
        bookingsPromise,
        customersPromise,
        providersPromise,
        ratingPromise
    ]);
    clearForm(false);
});


async function searchReviewById(id) {
    const trimmedId = String(id).trim();
    if (trimmedId === "") return;
    if (trimmedId === lastSearchedId) return;
    lastSearchedId = trimmedId;

    
    const index = findReviewIndex(trimmedId);
    if (index !== -1) {
        displayReview(reviews[index]);
        currentIndex = index;
        setFindButtonState();
        return;
    }

    
    try {
        const response = await fetch(`http://localhost:5000/reviews/${trimmedId}`);
        const result = await response.json();
        if (result.success && result.data) {
            displayReview(result.data);
            reviews.push(result.data);
            reviews.sort((a, b) => Number(a[0]) - Number(b[0]));
            currentIndex = findReviewIndex(trimmedId);
            setFindButtonState();
            return;
        }
    } catch (err) {
        console.error("Error searching review ID:", err);
    }

    bookingIdInput.value = "";
    customerIdInput.value = "";
    providerIdInput.value = "";
    ratingInput.selectedIndex = 0;
    reviewTextInput.value = "";
    setFindButtonState();
    if (findBtn) findBtn.innerText = "New";
    reviewIdInput.readOnly = false;
    reviewIdInput.removeAttribute("readonly");
    showMessage("No Record Found", "error");
}


findBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (findBtn.innerText === "New") {
            clearForm();
            return;
        }

        const isNewMode = (saveBtn && saveBtn.style.display !== "none");
        if (isNewMode) {
            
            reviewIdInput.readOnly = false;
            reviewIdInput.removeAttribute("readonly");
            reviewIdInput.value = "";
            bookingIdInput.value = "";
            customerIdInput.value = "";
            providerIdInput.value = "";
            ratingInput.selectedIndex = 0;
            reviewTextInput.value = "";
            originalRecord = null;
            currentIndex = -1;
            lastSearchedId = "";
            
            if (findBtn) findBtn.innerText = "New";
            setFindButtonState();
            reviewIdInput.focus();
            return;
        }

        const id = reviewIdInput.value.trim();

        if (id === "") {
            await fetchReviews();
            if (reviews.length === 0) {
                showMessage("No record found.", "error");
                return;
            }
            currentIndex = -1;
            if (findBtn) findBtn.innerText = "New";
            setFindButtonState();
            return;
        }

        await searchReviewById(id);
    });
});



async function fetchNextReviewId() {
    const isNewMode = (saveBtn && saveBtn.style.display !== "none");
    if (!isNewMode || reviewIdInput.value.trim() !== "" || isFetchingNextId) return;

    isFetchingNextId = true;
    try {
        const response = await fetch("http://localhost:5000/reviews/next-id");
        const result = await response.json();
        if (result.success && reviewIdInput.value.trim() === "") {
            isAutoFilling = true;
            reviewIdInput.value = result.nextId;
            reviewIdInput.dispatchEvent(new Event("input"));
        }
    } catch (err) {
        console.error("Error fetching next review ID:", err);
    } finally {
        isFetchingNextId = false;
    }
}

reviewIdInput.addEventListener("click", fetchNextReviewId);
reviewIdInput.addEventListener("focus", fetchNextReviewId);


function hasUnsavedChanges() {
    const isNewRecordMode = (saveBtn && saveBtn.style.display !== "none");
    if (isNewRecordMode) {
        return (bookingIdInput.value.trim() !== "" || 
                customerIdInput.value.trim() !== "" ||
                providerIdInput.value.trim() !== "" ||
                ratingInput.value !== "" ||
                reviewTextInput.value.trim() !== "");
    }
    return false;
}

function hasPendingUpdates() {
    const isUpdateMode = (updateBtn && updateBtn.style.display !== "none");
    if (isUpdateMode && originalRecord) {
        const rawBookingId = bookingIdInput.value.trim().split(" - ")[0].trim();
        const rawCustomerId = customerIdInput.value.trim().split(" - ")[0].trim();
        const rawProviderId = providerIdInput.value.trim().split(" - ")[0].trim();
        return (rawBookingId !== originalRecord.booking_id ||
                rawCustomerId !== originalRecord.customer_id ||
                rawProviderId !== originalRecord.provider_id ||
                ratingInput.value !== originalRecord.rating ||
                reviewTextInput.value.trim() !== originalRecord.review_text);
    }
    return false;
}


async function confirmLeave(onConfirmAction) {
    if (hasUnsavedChanges() || hasPendingUpdates()) {
        const choice = await showModal({
            title: "Save changes?",
            message: "Would you like to save the changes?",
            buttons: [
                { text: "Yes", class: "primary", value: "yes" },
                { text: "No", class: "secondary", value: "no" },
                { text: "Cancel", class: "neutral", value: "cancel" }
            ]
        });

        if (choice === "yes") {
            let success = false;
            if (hasUnsavedChanges()) {
                success = await saveRecord(false);
            } else if (hasPendingUpdates()) {
                success = await updateRecord(false);
            }
            if (success) {
                onConfirmAction();
            }
        } else if (choice === "no") {
            onConfirmAction();
        }
    } else {
        onConfirmAction();
    }
}

let lookupTimeout = null;


reviewIdInput.addEventListener("input", () => {
    hideMessage();
    if (lookupTimeout) {
        clearTimeout(lookupTimeout);
    }

    if (isAutoFilling) {
        isAutoFilling = false;
        return;
    }

    
    
    const hasFieldsFilled = (bookingIdInput.value.trim() !== "" || 
                            customerIdInput.value.trim() !== "" || 
                            providerIdInput.value.trim() !== "" || 
                            reviewTextInput.value.trim() !== "" || 
                            ratingInput.value !== "");
    const isModified = hasPendingUpdates();
    if ((hasFieldsFilled && !originalRecord) || isModified) {
        return;
    }

    const id = reviewIdInput.value.trim();
    if (id === "") {
        if (searchAbortController) {
            searchAbortController.abort();
            searchAbortController = null;
        }
        bookingIdInput.value = "";
        customerIdInput.value = "";
        providerIdInput.value = "";
        ratingInput.selectedIndex = 0;
        reviewTextInput.value = "";
        originalRecord = null;

        const isNewMode = (saveBtn && saveBtn.style.display !== "none");
        if (isNewMode) {
            resetButtonState();
            if (findBtn) findBtn.innerText = "Find";
        } else {
            setFindButtonState();
            if (findBtn) findBtn.innerText = "New";
        }
        return;
    }

    
    bookingIdInput.value = "";
    customerIdInput.value = "";
    providerIdInput.value = "";
    ratingInput.selectedIndex = 0;
    reviewTextInput.value = "";
    originalRecord = null;

    
    const index = findReviewIndex(id);
    if (index !== -1) {
        if (searchAbortController) {
            searchAbortController.abort();
            searchAbortController = null;
        }
        displayReview(reviews[index]);
        currentIndex = index;
        setFindButtonState();
        return;
    }

    
    lookupTimeout = setTimeout(async () => {
        await searchReviewById(id);
    }, 2000);
});


reviewIdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const id = reviewIdInput.value.trim();
        if (id !== "") {
            confirmLeave(async () => {
                if (lookupTimeout) {
                    clearTimeout(lookupTimeout);
                }
                await searchReviewById(id);
            });
        }
    }
});


prevBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (fetchPromise) await fetchPromise;
        if (reviews.length === 0) {
            showMessage("No record found.", "error");
            return;
        }
        if (currentIndex === 0) {
            showMessage("No previous record.", "error");
            return;
        }
        if (currentIndex === -1) {
            currentIndex = reviews.length - 1;
            displayReview(reviews[currentIndex]);
            setFindButtonState();
            return;
        }
        currentIndex--;
        displayReview(reviews[currentIndex]);
        setFindButtonState();
    });
});


nextBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (fetchPromise) await fetchPromise;
        if (reviews.length === 0) {
            showMessage("No record found.", "error");
            return;
        }
        if (currentIndex === reviews.length - 1) {
            showMessage("No next record.", "error");
            return;
        }
        if (currentIndex === -1) {
            currentIndex = 0;
            displayReview(reviews[currentIndex]);
            setFindButtonState();
            return;
        }
        currentIndex++;
        displayReview(reviews[currentIndex]);
        setFindButtonState();
    });
});


async function saveRecord(shouldClearForm = true) {
    const review_id = reviewIdInput.value.trim();
    const bookingIdVal = bookingIdInput.value.trim();
    const booking_id = bookingIdVal.split(" - ")[0].trim();
    const customerIdVal = customerIdInput.value.trim();
    const customer_id = customerIdVal.split(" - ")[0].trim();
    const providerIdVal = providerIdInput.value.trim();
    const provider_id = providerIdVal.split(" - ")[0].trim();
    const rating = ratingInput.value;
    const review_text = reviewTextInput.value.trim();

    if (review_id === "") {
        showMessage("Please enter Review ID.", "error");
        reviewIdInput.focus();
        return false;
    }
    if (booking_id === "") {
        showMessage("Please enter Booking ID.", "error");
        bookingIdInput.focus();
        return false;
    }
    if (customer_id === "") {
        showMessage("Please enter Customer ID.", "error");
        customerIdInput.focus();
        return false;
    }
    if (provider_id === "") {
        showMessage("Please enter Provider ID.", "error");
        providerIdInput.focus();
        return false;
    }
    if (rating === "") {
        showMessage("Please select Rating.", "error");
        ratingInput.focus();
        return false;
    }

    try {
        const response = await fetch("http://localhost:5000/reviews", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                review_id,
                booking_id,
                customer_id,
                provider_id,
                rating,
                review_text
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Saved successfully.", "success");
            await fetchReviews();
            if (shouldClearForm) {
                clearForm();
            } else {
                currentIndex = findReviewIndex(review_id);
                if (currentIndex !== -1) {
                    displayReview(reviews[currentIndex]);
                }
            }
            return true;
        } else {
            showMessage(result.message || "Error saving record.", "error");
            return false;
        }
    } catch (err) {
        console.error(err);
        showMessage("Server connection failed. Unable to save.", "error");
        return false;
    }
}


async function updateRecord(shouldClearForm = true) {
    const review_id = reviewIdInput.value.trim();
    const bookingIdVal = bookingIdInput.value.trim();
    const booking_id = bookingIdVal.split(" - ")[0].trim();
    const customerIdVal = customerIdInput.value.trim();
    const customer_id = customerIdVal.split(" - ")[0].trim();
    const providerIdVal = providerIdInput.value.trim();
    const provider_id = providerIdVal.split(" - ")[0].trim();
    const rating = ratingInput.value;
    const review_text = reviewTextInput.value.trim();

    if (review_id === "") {
        showMessage("Please enter Review ID.", "error");
        reviewIdInput.focus();
        return false;
    }
    if (booking_id === "") {
        showMessage("Please enter Booking ID.", "error");
        bookingIdInput.focus();
        return false;
    }
    if (customer_id === "") {
        showMessage("Please enter Customer ID.", "error");
        customerIdInput.focus();
        return false;
    }
    if (provider_id === "") {
        showMessage("Please enter Provider ID.", "error");
        providerIdInput.focus();
        return false;
    }
    if (rating === "") {
        showMessage("Please select Rating.", "error");
        ratingInput.focus();
        return false;
    }


    try {
        const response = await fetch(`http://localhost:5000/reviews/${review_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                booking_id,
                customer_id,
                provider_id,
                rating,
                review_text
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Updated successfully.", "success");
            await fetchReviews();
            if (shouldClearForm) {
                clearForm();
            } else {
                currentIndex = findReviewIndex(review_id);
                if (currentIndex !== -1) {
                    displayReview(reviews[currentIndex]);
                }
            }
            return true;
        } else {
            showMessage(result.message || "Error updating record.", "error");
            return false;
        }
    } catch (err) {
        console.error(err);
        showMessage("Server connection failed. Unable to update.", "error");
        return false;
    }
}


saveBtn.addEventListener("click", async () => {
    await saveRecord();
});


if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
        await updateRecord(false);
    });
}


exitBtn.addEventListener("click", () => {
    confirmLeave(() => {
        confirmBox.style.display = "block";
    });
});

yesExit.addEventListener("click", () => {
    confirmBox.style.display = "none";
    showMessage("Thank you for using House Help Management System.", "success");
    setTimeout(() => {
        clearForm();
    }, 1500);
});

noExit.addEventListener("click", () => {
    confirmBox.style.display = "none";
});




let bookings = [];
let customers = [];
let providers = [];
let ratingLOV = [];

async function fetchBookings() {
    try {
        const response = await fetch("http://localhost:5000/bookings");
        bookings = await response.json();
        
        
        const detailPromises = bookings.map(async (b) => {
            try {
                const detailResponse = await fetch(`http://localhost:5000/bookings/${b.booking_id}`);
                const detailResult = await detailResponse.json();
                if (detailResult.success && detailResult.data) {
                    b.provider_id = detailResult.data.provider_id;
                    b.customer_id = detailResult.data.customer_id;
                }
            } catch (err) {
                console.error("Error fetching detail for booking " + b.booking_id, err);
            }
        });
        await Promise.all(detailPromises);

        
        if (providers.length === 0) {
            await fetchProviders();
        }
        
        populateBookingDropdown(bookings);
    } catch (err) {
        console.error("Error fetching bookings:", err);
    }
}

async function fetchCustomers() {
    try {
        const response = await fetch("http://localhost:5000/customers");
        customers = await response.json();
    } catch (err) {
        console.error("Error fetching customers:", err);
    }
}

async function fetchProviders() {
    try {
        const response = await fetch("http://localhost:5000/providers");
        providers = await response.json();
    } catch (err) {
        console.error("Error fetching providers:", err);
    }
}

async function fetchRatingLOV() {
    try {
        const response = await fetch("http://localhost:5000/lov/ratings");
        ratingLOV = await response.json();
        populateRatingDropdown(ratingLOV);
    } catch (err) {
        console.error("Error fetching rating LOV:", err);
    }
}

function populateRatingDropdown(list) {
    if (!ratingInput) return;
    ratingInput.innerHTML = '<option value=""></option>' + list.map(item => {
        const displayValue = item.value.replace(/[0-9]/g, "").trim();
        return `
            <option value="${item.code}">${displayValue}</option>
        `;
    }).join("");
}

function populateBookingDropdown(list) {
    const tbody = document.getElementById("bookingDropdownBody");
    if (!tbody) return;
    tbody.innerHTML = list.map(item => {
        const provider = providers.find(p => String(p.provider_id) === String(item.provider_id));
        const providerName = provider ? provider.provider_name : "";
        return `
            <tr data-id="${item.booking_id}">
                <td>${item.booking_id}</td>
                <td>${item.customer_name}</td>
                <td>${providerName}</td>
                <td>${item.category_name}</td>
                <td>${item.booking_status}</td>
            </tr>
        `;
    }).join("");

    tbody.querySelectorAll("tr").forEach(tr => {
        tr.onclick = async (e) => {
            e.stopPropagation();
            const bookingId = tr.getAttribute("data-id");
            bookingIdInput.value = getFormattedBookingId(bookingId);
            bookingIdInput.dispatchEvent(new Event("input"));
            bookingIdInput.dispatchEvent(new Event("change"));
            document.getElementById("bookingDropdown").style.display = "none";

            
            try {
                const response = await fetch(`http://localhost:5000/bookings/${bookingId}`);
                const result = await response.json();
                if (result.success && result.data) {
                    customerIdInput.value = getFormattedCustomerId(result.data.customer_id);
                    customerIdInput.dispatchEvent(new Event("input"));
                    customerIdInput.dispatchEvent(new Event("change"));

                    providerIdInput.value = getFormattedProviderId(result.data.provider_id);
                    providerIdInput.dispatchEvent(new Event("input"));
                    providerIdInput.dispatchEvent(new Event("change"));
                }
            } catch (err) {
                console.error("Error fetching booking detail:", err);
            }
        };
    });
}


const bookingWrapper = document.getElementById("bookingWrapper");
const bookingDropdown = document.getElementById("bookingDropdown");

function adjustDropdownPosition() {
    if (!bookingWrapper || !bookingDropdown) return;
    
    const formBox = document.querySelector(".form-box");
    if (!formBox) return;
    
    const wrapperRect = bookingWrapper.getBoundingClientRect();
    const formBoxRect = formBox.getBoundingClientRect();
    
    
    const maxAllowedWidth = formBoxRect.width - 40;
    bookingDropdown.style.maxWidth = `${maxAllowedWidth}px`;
    
    
    let targetWidth = 700;
    if (targetWidth > maxAllowedWidth) {
        targetWidth = maxAllowedWidth;
    }
    bookingDropdown.style.width = `${targetWidth}px`;
    
    let targetLeftViewport = wrapperRect.left;
    
    
    if (targetLeftViewport + targetWidth > formBoxRect.right - 20) {
        targetLeftViewport = formBoxRect.right - 20 - targetWidth;
    }
    
    
    if (targetLeftViewport < formBoxRect.left + 20) {
        targetLeftViewport = formBoxRect.left + 20;
    }
    
    const relativeLeft = targetLeftViewport - wrapperRect.left;
    bookingDropdown.style.left = `${relativeLeft}px`;
    bookingDropdown.style.right = "auto";
}

window.addEventListener("resize", () => {
    if (bookingDropdown && bookingDropdown.style.display === "block") {
        adjustDropdownPosition();
    }
});

if (bookingIdInput && bookingDropdown) {
    bookingIdInput.onclick = (e) => {
        e.stopPropagation();
        if (bookingDropdown.style.display === "none" || bookingDropdown.style.display === "") {
            bookingDropdown.style.display = "block";
            adjustDropdownPosition();
        } else {
            bookingDropdown.style.display = "none";
        }
    };
}


document.addEventListener("click", (e) => {
    if (bookingDropdown && !bookingWrapper.contains(e.target)) {
        bookingDropdown.style.display = "none";
    }
});