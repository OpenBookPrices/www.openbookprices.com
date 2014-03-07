
$(function () {

  var api_base = 'http://127.0.0.1:3000';
  // var api_base = 'http://api.openbookprices.com';

  // Get the template's markup...
  var offerTemplate = $('#tmpl-offer').html();
  var pendingTemplate = $('#tmpl-pending').html();

  var pendingList = $('#pending');
  var resultsList = $('#results');

  var handlePricesResponse = function (response) {
    var request = response.request;
    var results = response.results;

    // FIXME - show currency and country details
    console.log(request);

    for (var i = 0; i < results.length; i++) {
      handleVendorResponse(results[i]);
    }

  };

  var displayOffer = function (offerRow, offer) {
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
  };

  var handleVendorResponse = function (response) {
    var isbn = response.request.isbn;
    var offers = response.offers;

    // display the prices
    _.each(offers, function (offer, condition) {
      var row_identifier = isbn + '-' + response.request.vendor + '-' + condition;

      // delete any existing li for this entry
      $('#offer-' + row_identifier).remove();

      var offerRow = $(
        _.template(
          offerTemplate,
          { response: response, offer : offer, condition: condition, id: row_identifier }
        )
      );

      displayOffer(offerRow, offer);
    });

    // if required start another fetch
    var pendingID = '#pending-' + response.vendor.code;
    if (response.meta.retryDelay) {

      if (!$(pendingID).size()) {
        var pendingRow = $(
          _.template(
            pendingTemplate,
            { response: response, id: response.vendor.code }
          )
        );
        pendingRow.appendTo(pendingList);
      }

      window.setTimeout(
        function () {
          $.get(
            response.request.url,
            handleVendorResponse
          );

        },
        response.meta.retryDelay*1000
      );
    } else {
      $(pendingID).remove();
    }

  };


  $("#isbn-form").submit( function (e) {

    // Prevent the form from submitting to the server.
    e.preventDefault();

    pendingList.find('li').remove();
    resultsList.find('li').remove();

    // Get the isbn number from the form field
    var isbn = $("#isbn-input").val();

    // Send a request to the API
    $.get(
      api_base + "/v1/books/" + isbn + "/prices",
      handlePricesResponse
    );


  });
});