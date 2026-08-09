let modalBox = null;

function openModal({ title, message, buttons = [{ text: "OK", class: "primary", value: "ok" }] }) {
    return new Promise((resolve) => {
        if (!modalBox) {
            modalBox = document.createElement("div");
            modalBox.className = "modal-overlay";
            document.body.appendChild(modalBox);
        }

        const btnHtml = buttons.map((item, i) => {
            let btnType = "modal-btn-secondary";

            if (item.class === "primary" || item.class === "success") {
                btnType = "modal-btn-primary";
            }

            if (item.class === "neutral") {
                btnType = "modal-btn-neutral";
            }

            return `<button class="modal-btn ${btnType}" data-index="${i}">${item.text}</button>`;
        }).join("");

        modalBox.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-actions">
                    ${btnHtml}
                </div>
            </div>
        `;

        setTimeout(() => {
            modalBox.classList.add("show");
        }, 10);

        modalBox.querySelectorAll(".modal-btn").forEach((btn) => {
            btn.onclick = () => {
                const i = parseInt(btn.dataset.index);
                modalBox.classList.remove("show");

                setTimeout(() => {
                    resolve(buttons[i].value);
                }, 200);
            };
        });
    });
}

const msgBox = document.getElementById("messageBox");

function showMsg(msg, type) {
    if (!msgBox) return;

    msgBox.innerText = msg;
    msgBox.className = "message-box " + type + " show";

    clearTimeout(msgBox.timer);

    msgBox.timer = setTimeout(() => {
        msgBox.className = "message-box";
    }, 5000);
}

function hideMsg() {
    if (!msgBox) return;

    clearTimeout(msgBox.timer);
    msgBox.className = "message-box";
    msgBox.innerText = "";
}

const categoryId = document.getElementById("category_id");
const categoryName = document.getElementById("category_name");
const description = document.getElementById("description");

const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const exitBtn = document.getElementById("exitBtn");
const findBtn = document.getElementById("findBtn");

let oldData = null;
let loadingId = false;
let autoFill = false;
let controller = null;

let categoryList = [];
let currIndex = -1;
let loadPromise = null;
let lastId = "";

async function loadCategories() {
    try {
        const response = await fetch("http://localhost:3000/service-category");
        const data = await response.json();

        categoryList = data;
        categoryList.sort((a, b) => Number(a[0]) - Number(b[0]));
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

function showCategory(row) {
    if (!row) return;

    const newMode = saveBtn.style.display !== "none";

    if (newMode) {
        categoryId.readOnly = true;
    } else {
        categoryId.readOnly = false;
    }

    categoryId.value = row[0];
    categoryName.value = row[1] || "";
    description.value = row[2] || "";

    oldData = {
        category_id: String(row[0]),
        category_name: row[1] || "",
        description: row[2] || ""
    };

    lastId = String(row[0]);
    findBtn.innerText = "New";
}

function resetButtons() {
    saveBtn.style.display = "inline-block";
    updateBtn.style.display = "none";
    prevBtn.style.display = "inline-block";
    nextBtn.style.display = "none";
}

function findModeButtons() {
    saveBtn.style.display = "none";
    updateBtn.style.display = "inline-block";
    prevBtn.style.display = "inline-block";
    nextBtn.style.display = "inline-block";
}

function clearFields(focus = true) {
    if (controller) {
        controller.abort();
        controller = null;
    }

    categoryId.readOnly = true;
    categoryId.value = "";
    categoryName.value = "";
    description.value = "";

    oldData = null;
    currIndex = -1;
    lastId = "";

    resetButtons();

    if (focus) {
        categoryId.focus();
    }

    findBtn.innerText = "Find";

    getNextId();
}

function getIndex(id) {
    return categoryList.findIndex(item => item[0] == id);
}

window.addEventListener("DOMContentLoaded", async () => {
    loadPromise = loadCategories();
    await loadPromise;
    clearFields(false);
});

async function findCategory(id) {
    const value = String(id).trim();

    if (value === "") return;
    if (value === lastId) return;

    lastId = value;

    const index = getIndex(value);

    if (index !== -1) {
        showCategory(categoryList[index]);
        currIndex = index;
        findModeButtons();
        return;
    }

    categoryName.value = "";
    description.value = "";

    findModeButtons();
    findBtn.innerText = "New";

    categoryId.readOnly = false;

    showMsg("No Record Found", "error");
}

findBtn.addEventListener("click", () => {
    confirmAction(async () => {
        hideMsg();

        if (findBtn.innerText === "New") {
            clearFields();
            return;
        }

        const newMode = saveBtn.style.display !== "none";

        if (newMode) {
            categoryId.readOnly = false;
            categoryId.value = "";
            categoryName.value = "";
            description.value = "";

            oldData = null;
            currIndex = -1;
            lastId = "";

            findBtn.innerText = "New";
            findModeButtons();

            categoryId.focus();
            return;
        }

        const id = categoryId.value.trim();

        if (id === "") {
            await loadCategories();

            if (categoryList.length === 0) {
                showMsg("No record found.", "error");
                return;
            }

            currIndex = -1;
            findBtn.innerText = "New";
            findModeButtons();
            return;
        }

        await findCategory(id);
    });
});

let timer = null;

async function getNextId() {
    const newMode = saveBtn.style.display !== "none";

    if (!newMode || categoryId.value.trim() !== "" || loadingId) {
        return;
    }

    loadingId = true;

    try {
        const response = await fetch("http://localhost:3000/service-category/next-id");
        const result = await response.json();

        if (result.success && categoryId.value.trim() === "") {
            autoFill = true;
            categoryId.value = result.nextId;
            categoryId.dispatchEvent(new Event("input"));
        }
    } catch (err) {
        console.error("Error fetching next ID:", err);
    } finally {
        loadingId = false;
    }
}

categoryId.addEventListener("click", getNextId);
categoryId.addEventListener("focus", getNextId);

function hasChanges() {
    const newMode = saveBtn.style.display !== "none";

    if (newMode) {
        return (
            categoryName.value.trim() !== "" ||
            description.value.trim() !== ""
        );
    }

    return false;
}

function isUpdated() {
    const updateMode = updateBtn.style.display !== "none";

    if (updateMode && oldData) {
        return (
            categoryName.value.trim() !== oldData.category_name ||
            description.value.trim() !== oldData.description
        );
    }

    return false;
}

async function confirmAction(nextStep) {
    if (hasChanges() || isUpdated()) {

        const choice = await openModal({
            title: "Save changes?",
            message: "Would you like to save the changes?",
            buttons: [
                { text: "Yes", class: "primary", value: "yes" },
                { text: "No", class: "secondary", value: "no" },
                { text: "Cancel", class: "neutral", value: "cancel" }
            ]
        });

        if (choice === "yes") {

            let done = false;

            if (hasChanges()) {
                done = await saveRecord(false);
            } else if (isUpdated()) {
                done = await updateRecord(false);
            }

            if (done) {
                nextStep();
            }

        } else if (choice === "no") {
            nextStep();
        }

    } else {
        nextStep();
    }
}

categoryId.addEventListener("input", () => {

    hideMsg();

    if (timer) {
        clearTimeout(timer);
    }

    if (autoFill) {
        autoFill = false;
        return;
    }

    const hasData =
        categoryName.value.trim() !== "" ||
        description.value.trim() !== "";

    if ((hasData && !oldData) || isUpdated()) {
        return;
    }
        const id = categoryId.value.trim();

    if (id === "") {

        if (controller) {
            controller.abort();
            controller = null;
        }

        categoryName.value = "";
        description.value = "";
        oldData = null;

        const newMode = saveBtn.style.display !== "none";

        if (newMode) {
            resetButtons();
            findBtn.innerText = "Find";
        } else {
            findModeButtons();
            findBtn.innerText = "New";
        }

        return;
    }

    categoryName.value = "";
    description.value = "";
    oldData = null;

    const index = getIndex(id);

    if (index !== -1) {

        if (controller) {
            controller.abort();
            controller = null;
        }

        showCategory(categoryList[index]);
        currIndex = index;
        findModeButtons();
        return;
    }

    timer = setTimeout(async () => {
        await findCategory(id);
    }, 2000);

});

categoryId.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        const id = categoryId.value.trim();

        if (id !== "") {

            confirmAction(async () => {

                if (timer) {
                    clearTimeout(timer);
                }

                await findCategory(id);

            });

        }
    }

});

function validName(name) {
    const pattern = /^[A-Za-z\s]+$/;
    return pattern.test(name);
}

async function checkCategoryName() {

    const name = categoryName.value.trim();

    if (name === "") {
        return true;
    }

    if (!validName(name)) {
        showMsg("No special characters or numbers allowed.", "error");
        categoryName.focus();
        return false;
    }

        const newMode = saveBtn.style.display !== "none";
    const currentId = categoryId.value.trim();

    let url = `http://localhost:3000/service-category/check-name?name=${encodeURIComponent(name)}`;

    if (!newMode && currentId !== "") {
        url += `&excludeId=${encodeURIComponent(currentId)}`;
    }

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success && result.exists) {
            showMsg("Service Category Name already exists", "error");
            categoryName.focus();
            return false;
        }

    } catch (err) {
        console.error("Error validating category name:", err);
    }

    return true;
}

categoryName.addEventListener("blur", async (e) => {

    const target = e.relatedTarget;

    if (
        target &&
        (
            target.tagName === "BUTTON" ||
            target.closest("button") ||
            target.classList.contains("mode-btn")
        )
    ) {
        return;
    }

    await checkCategoryName();

});

categoryName.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        e.preventDefault();
        categoryName.blur();
    }

});

prevBtn.addEventListener("click", () => {

    confirmAction(async () => {

        hideMsg();

        if (loadPromise) {
            await loadPromise;
        }

        if (categoryList.length === 0) {
            showMsg("No record found.", "error");
            return;
        }

        if (currIndex === 0) {
            showMsg("No previous record.", "error");
            return;
        }

        if (currIndex === -1) {
            currIndex = categoryList.length - 1;
            showCategory(categoryList[currIndex]);
            findModeButtons();
            return;
        }

        currIndex--;
        showCategory(categoryList[currIndex]);
        findModeButtons();

    });

});

nextBtn.addEventListener("click", () => {

    confirmAction(async () => {

        hideMsg();

        if (loadPromise) {
            await loadPromise;
        }

        if (categoryList.length === 0) {
            showMsg("No record found.", "error");
            return;
        }

        if (currIndex === categoryList.length - 1) {
            showMsg("No next record.", "error");
            return;
        }

        if (currIndex === -1) {
            currIndex = 0;
            showCategory(categoryList[currIndex]);
            findModeButtons();
            return;
        }

        currIndex++;
        showCategory(categoryList[currIndex]);
        findModeButtons();

    });

});

async function saveRecord(clear = true) {

    const category_id = categoryId.value.trim();
    const category_name = categoryName.value.trim();
    const desc = description.value.trim();

    if (category_id === "") {
        showMsg("Please enter Category ID.", "error");
        categoryId.focus();
        return false;
    }

    if (category_name === "") {
        showMsg("Please enter Category Name.", "error");
        categoryName.focus();
        return false;
    }

    if (!validName(category_name)) {
        showMsg("No special characters or numbers allowed.", "error");
        categoryName.focus();
        return false;
    }

    try {

        const response = await fetch("http://localhost:3000/service-category", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                category_id,
                category_name,
                description: desc
            })
        });

        const result = await response.json();

        if (result.success) {

            showMsg("New Category Created", "success");

            await loadCategories();

            if (clear) {

                clearFields();

            } else {

                currIndex = getIndex(category_id);

                if (currIndex !== -1) {
                    showCategory(categoryList[currIndex]);
                }

            }

            return true;

        } else {

            showMsg(result.message || "Error saving record.", "error");

            if (result.message && result.message.includes("Category Name already exists.")) {
                categoryName.focus();
            }

            return false;
        }

    } catch (err) {

        console.error(err);
        showMsg("Server connection failed. Unable to save.", "error");
        return false;

    }
}

async function updateRecord(clear = true) {

    const category_id = categoryId.value.trim();
    const category_name = categoryName.value.trim();
    const desc = description.value.trim();

    if (category_id === "") {
        showMsg("Please enter Category ID", "error");
        categoryId.focus();
        return false;
    }

    if (category_name === "") {
        showMsg("Please enter Category Name", "error");
        categoryName.focus();
        return false;
    }

    if (!validName(category_name)) {
        showMsg("No special characters or numbers allowed.", "error");
        categoryName.focus();
        return false;
    }

    try {

        const response = await fetch(`http://localhost:3000/service-category/${category_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                category_name,
                description: desc
            })
        });

        const result = await response.json();

        if (result.success) {

            showMsg("Existing Category Updated", "success");

            await loadCategories();

            if (clear) {

                clearFields();

            } else {

                currIndex = getIndex(category_id);

                if (currIndex !== -1) {
                    showCategory(categoryList[currIndex]);
                }

            }

            return true;

        } else {

            showMsg(result.message || "Error updating record", "error");

            if (result.message && result.message.includes("Category Name already exists")) {
                categoryName.focus();
            }

            return false;
        }

    } catch (err) {

        console.error(err);
        showMsg("Server connection failed. Unable to update.", "error");
        return false;

    }
}

saveBtn.addEventListener("click", async () => {
    await saveRecord();
});

updateBtn.addEventListener("click", async () => {
    await updateRecord(false);
});

exitBtn.addEventListener("click", () => {

    confirmAction(() => {

        hideMsg();

        showMsg("Thank you for using House Help Management System.", "success");

        setTimeout(() => {
            clearFields();
        }, 1500);

    });

});

let guideBox = null;

function escKey(e) {
    if (e.key === "Escape") {
        closeGuide();
    }
}

function closeGuide() {

    if (guideBox) {
        guideBox.classList.remove("show");
    }

    document.removeEventListener("keydown", escKey);

}

function openGuide() {

    const infoBox = document.getElementById("infoPopup");

    if (infoBox) {
        infoBox.classList.remove("show");
    }

    if (!guideBox) {

        guideBox = document.createElement("div");
        guideBox.className = "modal-overlay";
        guideBox.id = "guidelinesOverlay";

        document.body.appendChild(guideBox);

        guideBox.innerHTML = `
            <div class="modal-dialog guidelines-dialog">
                <span class="modal-close-btn" id="closeGuidelinesBtn">✖</span>

                <div class="modal-title-visible">
                    Service Category Name Guidelines
                </div>

                <div class="modal-body-content">

                    <div class="popup-section">

                        <div class="popup-title">
                            Validation Rules
                        </div>

                        <ul class="popup-rules">
                            <li>Only alphabets and spaces are allowed.</li>
                            <li>Numbers are not allowed.</li>
                            <li>Special characters are not allowed.</li>
                        </ul>

                        <div class="popup-note">
                            <strong>📝 NOTE: The Service Category Name must clearly represent a Household Service Category.</strong>
                        </div>

                    </div>

                    <div class="popup-split">

                        <div class="popup-examples accepted">
                            <div class="example-title">✅ Accepted Examples</div>
                            <ul>
                                <li>Cleaning</li>
                                <li>Cooking</li>
                                <li>Plumbing</li>
                                <li>Electrical</li>
                                <li>Home Nursing</li>
                                <li>Pest Control</li>
                            </ul>
                        </div>

                        <div class="popup-examples invalid">
                            <div class="example-title">❌ Invalid Examples</div>
                            <ul>
                                <li>Cleaning123</li>
                                <li>12345</li>
                                <li>Cleaning@Home</li>
                                <li>@Cleaning</li>
                                <li>abc!@</li>
                                <li>Empty Value</li>
                            </ul>
                        </div>

                    </div>

                </div>
            </div>
        `;
                guideBox.querySelector("#closeGuidelinesBtn").onclick = closeGuide;

        guideBox.onclick = (e) => {
            if (e.target === guideBox) {
                closeGuide();
            }
        };
    }

    setTimeout(() => {
        guideBox.classList.add("show");
    }, 10);

    document.addEventListener("keydown", escKey);
}

function loadInfo() {

    const infoIcon = document.getElementById("infoIcon");
    const infoBox = document.getElementById("infoPopup");

    if (!infoIcon || !infoBox) return;

    function showInfo() {
        infoBox.classList.add("show");
        setPosition();
    }

    function hideInfo() {
        infoBox.classList.remove("show");
    }

    function setPosition() {

        const box = document.querySelector(".container");

        if (!box) return;

        const boxRect = box.getBoundingClientRect();
        const iconRect = infoIcon.getBoundingClientRect();

        const width = infoBox.offsetWidth;
        const height = infoBox.offsetHeight;

        let top = iconRect.top - boxRect.top - height - 12;
        let left = iconRect.left - boxRect.left + (iconRect.width / 2) - (width / 2);

        const screenWidth = window.innerWidth;
        const boxLeft = boxRect.left;

        let finalLeft = left + boxLeft;

        if (finalLeft < 10) {
            left = 10 - boxLeft;
        } else if (finalLeft + width > screenWidth - 10) {
            left = (screenWidth - width - 10) - boxLeft;
        }

        let finalTop = top + boxRect.top;

        if (finalTop < 10) {
            top = 10 - boxRect.top;
        }

        infoBox.style.top = `${top}px`;
        infoBox.style.left = `${left}px`;
    }

    infoIcon.addEventListener("mouseenter", showInfo);

    infoIcon.addEventListener("mouseleave", hideInfo);

    infoIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        openGuide();
    });

    document.addEventListener("click", (e) => {
        if (!infoBox.contains(e.target) && e.target !== infoIcon) {
            hideInfo();
        }
    });

    window.addEventListener("resize", () => {
        if (infoBox.classList.contains("show")) {
            setPosition();
        }
    });

}

if (document.readyState !== "loading") {
    loadInfo();
} else {
    document.addEventListener("DOMContentLoaded", loadInfo);
}