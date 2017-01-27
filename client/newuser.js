var date = new Date();
var yy = date.getFullYear();
var mm = date.getMonth()+1;
var dd = date.getDate();
var creditNum = 0;
var creditCcv = 0;
var type = 0;
var routingNumber = 0;
var accountNumber = 0;

Template.newuser.events({
    'click #createnew': function () {
        Router.go('/user/newuser');
      // console.log("*** Click for Signup page ***");
      // Session.set( 'currentLoginPage', 'createNewUser');
    },
    'keypress': function (e) {
        if (e.keyCode == 13) {
            userLogin();
        }
    },
    'click #submit': function () {
        userLogin();
    }
});  

Template.createNewUser.events({
    'submit' : function( e ) {
        e.preventDefault();
        submitme();
        return false;
    },
    'click #bankcheck': function (){
        var value = document.getElementById("bankcheck").checked;
        if (value == true){
            document.getElementById("bankName").disabled = false;
            document.getElementById("routingNumber").disabled = false;
            document.getElementById("accountNumber").disabled = false;
        }
        else{
            document.getElementById("bankName").disabled = true;
            document.getElementById("routingNumber").disabled = true;
            document.getElementById("accountNumber").disabled = true;
        }
    }
});
              

Template.createNewUser.rendered = function() {   
    if(google) {
      autocomplete_init();      
    } 
    
    $('#birthdate').datepicker();
    $('#ccDate').datepicker();
    $(function () { $("input,select,textarea").not("[type=submit]").jqBootstrapValidation(); } );

};

Template.createNewUser.today = function() {
    return mm+"/"+dd+"/"+yy;
};

function submitme () {
    var username=first_name.value+"_"+last_name.value;
    username = username.toLowerCase();

    console.log("username = " + username);
    console.log("location = " + fulladdress.value);
    console.log("firstname = " + first_name.value);
    console.log("lastname = " + last_name.value);
    console.log("credt = " + credit_num.value );
    console.log("ccv = " + credit_ccv.value );

    creditNum = credit_num.value;
    creditCcv = credit_ccv.value;
    expireDate  = expire_date.value;
    bankChecked = document.getElementById("bankcheck").checked;
    if (bankChecked == true){
        routingNumber = routingNumber.value;
        accountNumber = accountNumber.value;
        bankName = bankName.value;
    }

    var email = email_data.value;
    var password = password1.value;
    var selected_salutaion = select_salutation.value;
    var selected_smartphone = smartphone.value;
    var selected_gender = gender.value;
    var selected_language = select_language.value;
    if (lat.value == "") {
        var geocoder = new google.maps.Geocoder();
        if ( google != null ) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode( { 'address': fulladdress.value}, function(results, status) {
                console.log(status);
                if (status == google.maps.GeocoderStatus.OK) {
                    lat = results[0].geometry.location.lat();
                    lng = results[0].geometry.location.lng();
                    var options = {
                        username: username,
                        email: email,
                        password: password,
                        profile: {
                            birthday: birthdate.value,
                            middle_initial: middle_initial.value,
                            fullname: first_name.value+" "+last_name.value,
                            firstname: first_name.value,
                            lastname: last_name.value,
                            salutation: selected_salutaion,
                            phone_number: phone_number.value,
                            sms_number: sms_number.value,
                            fulladdress: fulladdress.value,
                            address_lat:lat,
                            address_lng:lng,
                            smart_phone_type: selected_smartphone,
                            gender: selected_gender,
                            select_language: selected_language
                        }
                    };

                    Session.set("currentLocLat", lat);
                    Session.set("currentLocLong", lng);
                    Accounts.createUser(options, createUserCallback);
                    Meteor.Router.to('/');

                } else {
                    alert("Please check your network status at first. Thanks.");
                    return false;
                }
            });
        }
    }
    else {
        var options = {
            username: username,
            email: email,
            password: password,
            profile: {
                birthday: birthdate.value,
                middle_initial: middle_initial.value,
                fullname: first_name.value+" "+last_name.value,
                firstname: first_name.value,
                lastname: last_name.value,
                salutation: selected_salutaion,
                phone_number: phone_number.value,
                sms_number: sms_number.value,
                fulladdress: fulladdress.value,
                address_lat:lat.value,
                address_lng:lng.value,
                smart_phone_type: selected_smartphone,
                gender: selected_gender,
                select_language: selected_language
            }
        };
        Session.set("currentLocLat", lat.value);
        Session.set("currentLocLong", lng.value);
        Accounts.createUser(options, createUserCallback);
        Router.go('/'); 
        // Meteor.Router.to('/');
    }


    // event.preventDefault();
};

Template.loginView.serveCurrentLoginIs = function( comp ) {
    console.log("** serveCurrentLoginIs ***" + Session.get('currentLoginPage'));
    return ( Session.get( 'currentLoginPage' ) === comp );
};

function createUserCallback(error){

    // If there is an error, currently we just send the error to console
    // TODO: handle his more gracefully
    if (error){
        console.log("error : " + error );

    }
    else{
        // No error, now set up the Stripe account
        console.log("*** user created, setting up stripe ***" );
        console.log("fullname = " + Meteor.user().profile.fullname );

        // TODO: pass more user info
        var expire_year = expireDate.split("-")[1];
        var expire_month = expireDate.split("-")[0];
        var payment = new PaymentProcess();
        payment.setupStripeKey(Meteor.user().profile.fullname, creditNum, creditCcv, expire_month, expire_year);
        if(bankChecked == true) {
            console.log("Bank Create");
            Meteor.call( 'createBankaccount', bankName, routingNumber, accountNumber);
        }
    }
};

// initialise the jqueryUI autocomplete element
autocomplete_init = function() {
    $("#fulladdress").autocomplete({
        // source is the list of input options shown in the autocomplete dropdown.
        // see documentation: http://jqueryui.com/demos/autocomplete/
        source: function(request,response) {
              var geocoder = new google.maps.Geocoder();
              geocoder.geocode( {'address': request.term }, function(results, status) {
                response($.map(results, function(item) {
                  return {
                    label: item.formatted_address, // appears in dropdown box
                    value: item.formatted_address, // inserted into input element when selected
                    geocode: item                  // all geocode data: used in select callback event
                  }
                }));
              });       
        },

        // event triggered when drop-down option selected
        select: function(event,ui){
          update_ui(  ui.item.value, ui.item.geocode.geometry.location )
        }
    });

    // triggered when user presses a key in the address box
    $("#fulladdress").bind('keydown', function(event) {
        if(event.keyCode == 13) {
          geocode_lookup( 'address', $('#fulladdress').val(), true );

          // ensures dropdown disappears when enter is pressed
          $('#fulladdress').autocomplete("disable")
        } else {
          // re-enable if previously disabled above
          $('#fulladdress').autocomplete("enable")
        }
    });
}; // autocomplete_init

function update_ui( address, latLng ) {
  $('#fulladdress').autocomplete("close");
  $('#fulladdress').val(address);
  $('#lat').val(latLng.lat());
  $('#lng').val(latLng.lng());
};
function geocode_lookup( type, value, update ) {
  // default value: update = false
  update = typeof update !== 'undefined' ? update : false;

  request = {};
  request[type] = value;
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode(request, function(results, status) {
    $('#gmaps-error').html('');
    if (status == google.maps.GeocoderStatus.OK) {
      // Google geocoding has succeeded!
      if (results[0]) {
        // Always update the UI elements with new location data
        update_ui( results[0].formatted_address,
                   results[0].geometry.location )
      } else {
        // Geocoder status ok but no results!?
        $('#gmaps-error').html("Sorry, something went wrong. Try again!");
      }
    } else {
      // Google Geocoding has failed. Two common reasons:
      //   * Address not recognised (e.g. search for 'zxxzcxczxcx')
      //   * Location doesn't map to address (e.g. click in middle of Atlantic)

      if( type == 'address' ) {
        // User has typed in an address which we can't geocode to a location
        $('#gmaps-error').html("Sorry! We couldn't find " + value + ". Try a different search term, or click the map." );
      } else {
        // User has clicked or dragged marker to somewhere that Google can't do a reverse lookup for
        // In this case we display a warning, clear the address box, but fill in LatLng
        $('#gmaps-error').html("Woah... that's pretty remote! You're going to have to manually enter a place name." );
        update_ui('', value)
      }
    };
  });
};
function userLogin () {
    // alert("123");
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    console.log("*** Login Submit Click***");
    Meteor.loginWithPassword(email, password, function (err) {
        if (err) { 
            setTimeout(function(){
                var message = "Your mail address or password is incorrect.";
                FlashMessages.sendError(message, { hideDelay: 3500 });
            },1500);

        }
        else {
            Meteor.user();
            if (Session.get("trackForRouter") == null) {
                Router.go('/'); 
            }
            else {
                Router.go(Session.get("trackForRouter")); 
            }
        }
    });
}
