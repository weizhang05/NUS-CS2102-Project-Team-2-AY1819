console.log("in reservations");

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
});