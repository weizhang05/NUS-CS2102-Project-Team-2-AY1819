const branches_search = document.getElementById("search-branches-rating-input");
const branches_rating_display = document.getElementById("branches-rating-display");
const branches_count = document.getElementById("branches-count");

branches_search.addEventListener('input', function(event) {
    const search_txt = branches_search.value;
    const tbody = branches_rating_display.tBodies[0];
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
    branches_count.textContent = matches;
});