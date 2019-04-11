console.log("in reservations");

function closeAlert() {
    var x = document.getElementById("success-alert");
    x.remove();
}


$(document).ready(function () {
    /*
    For DELETE
     */
    $('#delete-reservation-id').on('change', function() {
        var temp = $('#delete-reservation-id :selected').text();
        var customerName = $("td:contains('" + temp + "')").parent().find("td").eq(1).text();
        var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#delete-reservation-customer-name").val(customerName);
        $("#delete-reservation-branch-name").val(branchName);
    });

    $('.branch-id').on('change', function() {
        var temp = $('.branch-id :selected').text();
        var branchName = $("td:contains('" + temp + "')").parent().find("td").eq(2).text();
        $("#branch-name").val(branchName);
    });

    /*
    For EDIT
     */
    $('#edit-reservation-id').on('change', function() {
        var temp = $('#edit-reservation-id :selected').text();
        var currentTiming = $("td:contains('" + temp + "')").parent().find("td").eq(3).text();
        $("#edit-reservation-timing").val(currentTiming);
    });

    var infoMessage = $('#success-alert').text();
    if (infoMessage.includes("ensure")) {
        console.log("present");
        $('#success-alert').removeClass( "alert-success" ).addClass( "alert-danger" );
    }
});

const reservation_search = document.getElementById("search-reservations-input");
const reservation_display = document.getElementById("reservations-display");
const reservation_count = document.getElementById("reservations-count");

reservation_search.addEventListener('input', function(event) {
    const search_txt = reservation_search.value.toLowerCase();
    const tbody = reservation_display.tBodies[0];
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
    reservation_count.textContent = matches;
});