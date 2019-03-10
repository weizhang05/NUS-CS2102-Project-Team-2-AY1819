console.log("in the admins");

const user_search = document.getElementById("search-users-input");
const user_display = document.getElementById("users-display");
const user_count = document.getElementById("user-count");

user_search.addEventListener('input', function(event) {
    const search_txt = user_search.value;
    const tbody = user_display.tBodies[0];
    let matches = 0;
    for (const row of tbody.rows) {
        let found = false;
        for (const cell of row.cells) {
            if (cell.textContent.search(search_txt) >= 0) {
                found = true;
                matches += 1;
                break;
            }
        }
        row.style.display = found ? "" : "none";
    }
    user_count.textContent = matches;
});
