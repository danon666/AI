document.addEventListener("DOMContentLoaded", () => {
    const taskList = document.getElementById("taskList");
    const addBtn = document.getElementById("addBtn");
    const newTask = document.getElementById("newTask");
    const newDate = document.getElementById("newDate");
    const search = document.getElementById("search");

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    renderList(tasks);

    addBtn.addEventListener("click", () => {
        const text = newTask.value.trim();
        const date = newDate.value ? new Date(newDate.value) : null;

        if (text.length < 3 || text.length > 255) {
            alert("Zadanie musi mieć od 3 do 255 znaków.");
            return;
        }

        tasks.push({ text, date: newDate.value });
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderList(tasks);

        newTask.value = "";
        newDate.value = "";
    });

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        if (query.length >= 2) {
            const filtered = tasks.filter(t => t.text.toLowerCase().includes(query));
            renderList(filtered, query);
        } else {
            renderList(tasks);
        }
    });

    taskList.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const index = Number(e.target.closest("li").dataset.index);
            if (!Number.isNaN(index)) {
                tasks.splice(index, 1);
                localStorage.setItem("tasks", JSON.stringify(tasks));
                renderList(tasks);
            }
            e.stopPropagation();
            return;
        }

        if (e.target.tagName === "SMALL") {
            const li = e.target.closest("li");
            const index = Number(li.dataset.index);
            if (Number.isNaN(index)) return;

            const current = tasks[index].date || "";
            const input = document.createElement("input");
            input.type = current.includes("T") ? "datetime-local" : "date";
            input.value = current;
            input.className = "edit-date-input";

            e.target.replaceWith(input);
            input.focus();

            const saveDate = () => {
                tasks[index].date = input.value;
                localStorage.setItem("tasks", JSON.stringify(tasks));
                renderList(tasks);
            };

            input.addEventListener("blur", saveDate);
            input.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") {
                    input.blur();
                } else if (ev.key === "Escape") {
                    renderList(tasks);
                }
            });
        }
    });


    function renderList(list, highlight = "") {
        taskList.innerHTML = "";
        list.forEach((task) => {
            const li = document.createElement("li");
            const originalIndex = tasks.indexOf(task);
            li.dataset.index = originalIndex;

            let textHTML = task.text;
            if (highlight) {
                const regex = new RegExp(`(${highlight})`, "gi");
                textHTML = task.text.replace(regex, "<span class='highlight'>$1</span>");
            }

            li.innerHTML = `
                <span class="task-text">${textHTML}</span>
                <div>
                    ${task.date ? `<small>${task.date.replace("T", " ")}</small>` : ""}
                    <button class="delete-btn">Usuń</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    taskList.addEventListener("dblclick", (e) => {
        const textEl = e.target.closest(".task-text");
        if (!textEl) return;

        const li = textEl.closest("li");
        const index = Number(li.dataset.index);
        if (Number.isNaN(index)) return;

        const original = tasks[index].text;
        const input = document.createElement("input");
        input.type = "text";
        input.value = original;
        input.className = "edit-text-input";
        input.maxLength = 255;

        textEl.replaceWith(input);
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);

        const save = () => {
            const val = input.value.trim();
            if (val.length < 3) {
                alert("Zadanie musi mieć od 3 do 255 znaków.");
                input.focus();
                return;
            }
            tasks[index].text = val;
            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderList(tasks);
        };

        const cancel = () => renderList(tasks);

        input.addEventListener("blur", save);
        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") save();
            else if (ev.key === "Escape") cancel();
        });
    });
});
