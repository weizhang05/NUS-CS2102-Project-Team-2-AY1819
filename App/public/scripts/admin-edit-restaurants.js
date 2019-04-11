console.log("in the restaurants");

function closeAlert() {
    var x = document.getElementById("success-alert");
    x.remove();
}

$(document).ready(function () {
    $('.restaurant-id-cuisine').on('change', function() {
        var temp = $('.restaurant-id-cuisine :selected').text();
        var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#restaurant-name-cuisine").val(restaurantName);
    });

    $('.branch-id').on('change', function() {
        var temp = $('.branch-id :selected').text();
        var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#branch-name").val(branchName);
    });

    $('.restaurant-id-menu').on('change', function() {
        var temp = $('.restaurant-id-menu :selected').text();
        var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#restaurant-name-menu").val(restaurantName);
    });
});

const restaurant_search = document.getElementById("search-restaurants-input");
const restaurant_display = document.getElementById("restaurants-display");
const restaurant_count = document.getElementById("restaurants-count");

restaurant_search.addEventListener('input', function(event) {
    const search_txt = restaurant_search.value.toLowerCase();
    const tbody = restaurant_display.tBodies[0];
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
    restaurant_count.textContent = matches;
});

const cuisine_search = document.getElementById("search-cuisines-input");
const cuisines_display = document.getElementById("cuisines-display");

cuisine_search.addEventListener('input', function(event) {
  const search_txt = cuisine_search.value.toLowerCase();
  const tbody = cuisines_display.tBodies[0];
  for (const row of tbody.rows) {
    let found = false;
    for (const cell of row.cells) {
      if (cell.textContent.toLowerCase().search(search_txt) >= 0) {
        found = true;
        break;
      }
    }
    row.style.display = found ? "" : "none";
  }
});

const menu_items_search = document.getElementById("search-menu-items-input");
const menu_items_display = document.getElementById("menu-items-display");

menu_items_search.addEventListener('input', function(event) {
    const search_txt = menu_items_search.value.toLowerCase();
    const tbody = menu_items_display.tBodies[0];
    for (const row of tbody.rows) {
        let found = false;
        for (const cell of row.cells) {
            if (cell.textContent.toLowerCase().search(search_txt) >= 0) {
                found = true;
                break;
            }
        }
        row.style.display = found ? "" : "none";
    }
});

