console.log("in the restaurants");

function closeAlert() {
    var x = document.getElementById("success-alert");
    x.remove();
}

const restaurant_search = document.getElementById("search-restaurants-input");
const restaurant_display = document.getElementById("restaurants-display");
const restaurant_count = document.getElementById("restaurants-count");

restaurant_search.addEventListener('input', function(event) {
    const search_txt = restaurant_search.value;
    const tbody = restaurant_display.tBodies[0];
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
    restaurant_count.textContent = matches;
});

const cuisine_search = document.getElementById("search-cuisines-input");
const cuisines_display = document.getElementById("cuisines-display");

cuisine_search.addEventListener('input', function(event) {
  const search_txt = cuisine_search.value;
  const tbody = cuisines_display.tBodies[0];
  for (const row of tbody.rows) {
    let found = false;
    for (const cell of row.cells) {
      if (cell.textContent.search(search_txt) >= 0) {
        found = true;
        break;
      }
    }
    row.style.display = found ? "" : "none";
  }
});
