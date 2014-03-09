/*

  TODO

  * add url to offer block
  * ? add signature to offer entry?
  * ? add condition to offer entry?

*/


$(function () {

  var api_base = 'http://127.0.0.1:3000';
  // var api_base = 'http://api.openbookprices.com';

  // Get the template's markup...
  var offerTemplate = $('#tmpl-offer').html();
  var pendingTemplate = $('#tmpl-pending').html();

  var pendingList = $('#pending');
  var resultsList = $('#results');

  /*
    Callback to handle the initial request for all prices. The response
    includes an array of results which will be identical to those returned by
    the vendor specific price queries. This means that mostly we just need to
    pass those results to the same code that would handle the vendor specific
    response.
  */
  var handlePricesResponse = function (response) {

    // Remove all the contents of the two result lists
    pendingList.find('li').remove();
    resultsList.find('li').remove();

    // Go through all the results and pass them to the handleVendorResponse
    // callback as they are the same as you'd get from the vendor specific
    // price request.
    _.each(response.results, handleVendorResponse);

    // FIXME - show country and currency details

  };

  var displayOffer = function (offerRow, offer) {

    // Insert the rows in order with the cheapest first. Find the first
    // row that is more expensive than this offer. If found insert before it,
    // otherwise at end of list.

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

    // Whilst fetching data we'll show a pending indicator per vendor. Work out
    // what ID this should have.
    var pendingID = '#pending-' + response.vendor.code;

    // If another fetch is needed (eg data is old, or not available yet) retryDelay will be true.
    if (response.meta.retryDelay) {

      // Another fetch is required for better data.

      // If not already being shown display a pending fetch indicator.
      if (!$(pendingID).size()) {
        var pendingRow = $(
          _.template(
            pendingTemplate,
            { response: response, id: response.vendor.code }
          )
        );
        pendingRow.appendTo(pendingList);
      }

      // Use setTimeout to delay the next fetch as required.
      window.setTimeout(
        function () {
          $.get(
            response.request.url, // url to query was provided by API
            handleVendorResponse
          );
        },
        response.meta.retryDelay * 1000 // delay is provided by API
      );
    } else {
      // Data is good, no subsequent fetch required. Remove any pending
      // indicator.
      $(pendingID).remove();
    }

  };


  $("#isbn-form").submit( function (e) {

    // Prevent the form from submitting to the server.
    e.preventDefault();

    // Get the isbn number from the form field
    var isbn = $("#isbn-input").val();

    // Send a request to the API for prices from all vendors. Note that there
    // is no country or currency specified - let the server determine that from
    // the IP address and then redirect (which jQuery will follow for us).
    // Likewise let the server tidy up the isbn number and 404 or redirect as
    // required.
    $.get(
      api_base + "/v1/books/" + isbn + "/prices",
      handlePricesResponse
    );

    // FIXME - show currency and country details

  });
});