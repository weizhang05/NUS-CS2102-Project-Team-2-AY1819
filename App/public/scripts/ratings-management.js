const branches_search = document.getElementById("search-branches-rating-input");
const branches_rating_display = document.getElementById("branches-rating-display");
const branches_count = document.getElementById("branches-count");

branches_search.addEventListener('input', function(event) {
    const search_txt = branches_search.value.toLowerCase();
    const tbody = branches_rating_display.tBodies[0];
    let matches = 0;
    for (const row of tbody.rows) {
        let found = false;
        for (const cell of row.cells) {
            if (cell.textContent.toLowerCase().search(search_txt) >= 0) {
                found = true;
                matches += 1;
                break;
            }
        }
        row.style.display = found ? "" : "none";
    }
    branches_count.textContent = matches;
});

const restaurants_search = document.getElementById("search-restaurants-rating-input");
const restaurants_rating_display = document.getElementById("restaurants-rating-display");
const restaurants_count = document.getElementById("restaurants-count");

restaurants_search.addEventListener('input', function(event) {
    const search_txt = restaurants_search.value.toLowerCase();
    const tbody = restaurants_rating_display.tBodies[0];
    let matches = 0;
    for (const row of tbody.rows) {
        let found = false;
        for (const cell of row.cells) {
            if (cell.textContent.toLowerCase().search(search_txt) >= 0) {
                found = true;
                matches += 1;
                break;
            }
        }
        row.style.display = found ? "" : "none";
    }
    restaurants_count.textContent = matches;
});

function closeAlert() {
    var x = document.getElementById("success-alert");
    x.remove();
}

$(document).ready(function () {
    var infoMessage = $('#success-alert').text();
    if (infoMessage.includes("ensure")) {
        console.log("present");
        $('#success-alert').removeClass( "alert-success" ).addClass( "alert-danger" );
    }
});