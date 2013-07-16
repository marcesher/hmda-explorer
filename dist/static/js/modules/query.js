// Scope
// -----

// To avoid global scope pollution, declare all variables and functions inside an
// [immediately-invoked function expression](http://benalman.com/news/2010/11/immediately-invoked-function-expression/) using an augmented [module pattern](http://addyosmani.com/resources/essentialjsdesignpatterns/book/#modulepatternjavascript).

var PDP = (function ( pdp ) {

  'use strict';

  // The Query Object
  // ----------------
  // The `query` object is used to cache filter values and store methods 
  // that manipulate filter values. 

  var query = {};

  // Set a default format for the data download.

  query.format = 'json';

  // Set a default endpoint for AJAX requests.

  query.endpoint = 'static/js/dummy_data/';

  // `query`'s `params` stores filter values.

  query.params = {};

  // The `reset` method resets the `params` object to some defaults.
  // If empty: true is passed, `params` will be cleared completely.

  query.reset = function( options ) {

    var opts = options || {};

    if ( opts.empty ) {
      this.params = {};
    } else {
      this.params = {
        as_of_year: [2011]
      };
    }

  };

  // The `updateAll` method runs through all the filter field values the user has selected
  // and stores them in the `params` object.

  query.updateAll = function( options ) {

    var fields,
        opts = options || {};

    // Get our fields array from either the hash in the url or the DOM field elements.

    if ( opts.source === 'url' ) {
      fields = pdp.app.getUrlValues();
    } else {
      fields = pdp.form.getFields();
    }

    this.reset({ empty: true });

    // Iterate over all the filter field values and push them into `query.params`.

    function processField( field ) {

      if ( field.name && field.value ) {

        // Initalize an empty array if need be.

        if ( typeof query.params[ field.name ] === 'undefined' ) {
          query.params[ field.name ] = [];
        }

        _.forEach( field.value, function( val, name ){

          query.params[ field.name ].push( val );

        });

      }

    }

    _.forEach( fields, processField );

  };

  // The `generateUrlHash` method builds and returns a URL hash from `query`'s `params`.

  query.generateUrlHash = function() {

    var hash,
        hashParams = [];

    // Loop through params, stringify them and push them into the temp array.

    function buildHashParam( param, name ) {

      // If it's not a number, add quotes around the params.

      hashParams.push( name + '=' + param.join(',') );

    }

    _.forEach( query.params, buildHashParam );

    hash = '!/' + hashParams.join('&');

    return hash;

  };

  // The `generateApiUrl` method builds and returns a Qu URL from `query`'s `params`.

  query.generateApiUrl = function( format ) {

    var url,
        downloadFormat = format || this.format,
        params = [];

    // Set a base url to append params to

    url = 'http://qu.demo.cfpb.gov/data/hmda/hmda_lar.' + downloadFormat;

    // Convert each param to a proper [`$where` clause](http://cfpb.github.io/qu/articles/queries.html#where_in_detail).

    function buildClause( param, name ) {

      // If there's only value for the param, meaning they only selected one item or
      // it's a radio button that only allows once value, add the stringified
      // param to the `params` array.

      if ( param.length === 1 ) {

        // Wrap it in quotes if it's NaN.

        if ( isNaN( param[0] ) ) {
          params.push( name + '="' + param[0] + '"' );
        } else {
          params.push( name + '=' + param[0]);
        }

      // If there are multiple values for a single parameter, we iterate over them and
      // put an `OR` operator between them. We then then [group them](http://cfpb.github.io/qu/articles/queries.html#boolean_operators)
      // with parens and add the grouping to the `params` array.

      } else if ( param.length > 1 ) {

        var _params = [];

        _.forEach( param, function( val, key ){

          // Wrap it in quotes if it's NaN.

          if ( isNaN( val ) ) {
            _params.push( name + '="' + val + '"' );
          } else {
            _params.push( name + '=' + val);
          }

        });

        _params = '(' + _params.join(' OR ') + ')';

        params.push( _params );

      }

    }

    _.forEach( query.params, buildClause );

    // Join all the params with `AND` operators and append it to the base url.

    url += '?$where=' + params.join(' AND ');

    return url;

  };

  // The `fetch` method requests and returns JSON from Qu matching the
  // user's filter and grouping clauses

  query.fetch = function() {

  };

  // Export the public API.

  pdp.query = query;

  return pdp;

}( PDP || {} ));