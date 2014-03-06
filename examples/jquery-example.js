
$(function () {
  // Get the template's markup...
  var offerTemplate = $('#tmpl-offer').html();
  var pendingTemplate = $('#tmpl-pending').html();

  $("#isbn-form").submit( function (e) {

    // Prevent the form from submitting to the server.
    e.preventDefault();

    var pendingList = $('#pending');
    pendingList.find('li').remove();

    var resultsList = $('#results');
    resultsList.find('li').remove();

    // Get the isbn number from the form field
    var isbn = $("#isbn-input").val();

    var handlePricesResponse = function (data) {
      var request = data.request;
      var results = data.results;

      // FIXME - show currency and country details
      console.log(request);

      for (var i = 0; i < results.length; i++) {
        handleVendorResponse(results[i]);
      }

    };

    var handleVendorResponse = function (data) {
      var offers = data.offers;

      // display the prices
      _.each(offers, function (offer, condition) {
        var row_identifier = isbn + '-' + data.request.vendor + '-' + condition;

        // delete any existing li for this entry
        $('#offer-' + row_identifier).remove();

        var offerRow = $(
          _.template(
            offerTemplate,
            { data: data, offer : offer, condition: condition, id: row_identifier }
          )
        );

        // Insert the rows in order with the cheapest first. Find the first
        // row that is more expensive than this offer.
        var more_expensive_row = resultsList.find('li').filter(function (index) {
          var row = $(this);
          var total = parseFloat( row.data().totalPrice );
          return total > offer.total;
        }).first();

        offerRow.hide();
        if (more_expensive_row.size()) {
          offerRow.insertBefore(more_expensive_row);
        } else {
          offerRow.appendTo(resultsList);
        }
        offerRow.slideDown();
      });

      // if required start another fetch
      var pendingID = '#pending-' + data.vendor.code;
      if (data.meta.retryDelay) {

        if (!$(pendingID).size()) {
          var pendingRow = $(
            _.template(
              pendingTemplate,
              { data: data, id: data.vendor.code }
            )
          );
          pendingRow.appendTo(pendingList);
        }

        window.setTimeout(
          function () {
            $.get(
              data.request.url,
              handleVendorResponse
            );

          },
          data.meta.retryDelay*1000
        );
      } else {
        $(pendingID).remove();
      }

    };

    // Send a request to the API
    var api_base = 'http://127.0.0.1:3000';
    // var api_base = 'http://api.openbookprices.com';
    $.get(
      api_base + "/v1/books/" + isbn + "/prices",
      handlePricesResponse
    );


  });
});