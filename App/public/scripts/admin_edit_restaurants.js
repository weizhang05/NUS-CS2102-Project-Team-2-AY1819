console.log("in the restaurants");

function closeAlert() {
    var x = document.getElementById("success-alert");
    x.remove();
}

$(document).ready(function () {

    /*
    For CUISINE
     */

    var temp = $('.restaurant-id-cuisine :selected').text();
    var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
    $("#restaurant-name").val(restaurantName);

    $('.restaurant-id-cuisine').on('change', function() {
        var temp = $('.restaurant-id-cuisine :selected').text();
        var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#restaurant-name").val(restaurantName);
    });

    /*
    For ADD BRANCH
     */

    var temp = $('#add-branch-restaurant-id :selected').text();
    var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
    $("#add-branch-restaurant-name").val(restaurantName);

    $('#add-branch-restaurant-id').on('change', function() {
        var temp = $('#add-branch-restaurant-id :selected').text();
        var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#add-branch-restaurant-name").val(restaurantName);
    });

    /*
    For EDIT BRANCH
     */

    var temp = $('#edit-branch-id :selected').text();
    var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
    var branchAddress = $("td:contains('" + temp + "')").parent().find("td").eq(3).text();
    var branchCapacity = $("td:contains('" + temp + "')").parent().find("td").eq(5).text();
    $("#edit-branch-name").val(branchName);
    $("#edit-branch-address").val(branchAddress);
    $("#edit-branch-capacity").val(branchCapacity);


    $('#edit-branch-id').on('change', function() {
        var temp = $('#edit-branch-id :selected').text();
        var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        var branchAddress = $("td:contains('" + temp + "')").parent().find("td").eq(3).text();
        var branchCapacity = $("td:contains('" + temp + "')").parent().find("td").eq(5).text();
        $("#edit-branch-name").val(branchName);
        $("#edit-branch-address").val(branchAddress);
        $("#edit-branch-capacity").val(branchCapacity);
    });


    /*
    For DELETE BRANCH
     */

    var temp = $('#delete-branch-id :selected').text();
    var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
    $("#delete-branch-name").val(branchName);

    $('#delete-branch-id').on('change', function() {
        var temp = $('#delete-branch-id :selected').text();
        var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#delete-branch-name").val(branchName);
    });

    /*
    For EDIT RESTAURANT
     */

    var temp = $('#restaurant-id :selected').text();
    var restaurantAccountName = $("td:contains('" + temp + "')").parent().find("td").eq(1).text();
    var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
    $("#edit-restaurant-account-name").val(restaurantAccountName);
    $("#edit-restaurant-name").val(restaurantName);

    $('#restaurant-id').on('change', function() {
        var temp = $('#restaurant-id :selected').text();
        var restaurantAccountName = $("td:contains('" + temp + "')").parent().find("td").eq(1).text();
        var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#edit-restaurant-account-name").val(restaurantAccountName);
        $("#edit-restaurant-name").val(restaurantName);
    });

    /*
    For DELETE RESTAURANT
     */

    var temp = $('#delete-restaurant-id :selected').text();
    var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
    $("#delete-restaurant-name").val(restaurantName);

    $('#delete-restaurant-id').on('change', function() {
        var temp = $('#delete-restaurant-id :selected').text();
        var restaurantName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#delete-restaurant-name").val(restaurantName);
    });

    var infoMessage = $('#success-alert').text();
    if (infoMessage.includes("ensure")) {
        console.log("present");
        $('#success-alert').removeClass( "alert-success" ).addClass( "alert-danger" );
    }
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
