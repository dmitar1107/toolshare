mapsApiKey = "AIzaSyC3N6JXpelWqeDw_qzPGxn9srjYAeRZ71Q";
map = null;
currentMarkers = new Array();

function initialize(){
        try {
            if ( google != null ) {
                    var mapOptions = {
                        center: new google.maps.LatLng(Session.get( 'currentUser_lat'),Session.get( 'currentUser_lng')),
                        zoom: 12,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    };      
                    map = new google.maps.Map($("#toolMap")[0], mapOptions);
                    var myLatlng = new google.maps.LatLng(Session.get( 'currentUser_lat'), Session.get( 'currentUser_lng')); 
                    var marker = new google.maps.Marker({
                        map: map,
                        position: myLatlng,
                        icon: "http://cdn.webiconset.com/map-icons/images/pin6.png",
                        title:Session.get("currentUser_fulladdress").toString()
                    });
                    placeCurrentMarkers( map );
            }       

        }
        catch(err){
            console.log(err);
        }
    return true;
};

Template.toolList.rendered = function(){
    initialize();
};

function gotPosition(pos) {

    Session.set( 'currentLocLat', pos.coords.latitude );
    Session.set( 'currentLocLong', pos.coords.longitude);
    Session.set( 'currentLocAccuracy', pos.coords.accuracy );
    console.log("** Got Position! ***");
}

function errorGettingPosition(err) {
    if(err.code==1)
    {
        console.log("User denied geolocation.");
    }
    else if(err.code==2)
    {
        console.log("Position unavailable.");
    }
    else if(err.code==3)
    {
        console.log("Timeout expired.");
    }
    else
    {
        console.log("ERROR:"+ err.message);
    }
}

Template.rentCell.placeMarkers = function ( address, city, state, lat, lng) {
    console.log( "placeMarkers: " + address + "," + city + "," + state );
    currentMarkers.push( { address:address, city:city, state:state, lat:lat, lng:lng } );
}

function resetCurrentMarkers() {
    if ( currentMarkers != null )
        currentMarkers.length = 0;
}

function placeCurrentMarkers( myMap ) {
    try {
        if ( google != null ) {
            var geocoder = new google.maps.Geocoder();
            if (Session.get("tool_data") !=  undefined) {
                for( i=0; i<Session.get("tool_data").length; i++ ) {
                    var pinIcon = new google.maps.MarkerImage(
                        Session.get("tool_data")[i].thumbnail, null, null, null, new google.maps.Size(42, 68)
                    );            
                    var myLatlng = new google.maps.LatLng(Session.get("tool_data")[i].lat, Session.get("tool_data")[i].lng); 
                    var marker = new google.maps.Marker({
                        map: myMap,
                        position: myLatlng,
                        icon: pinIcon,
                        draggable: true,
                        scaleControl: true,
                        title:Session.get("tool_data")[i].toolname.toString()
                    });
                      google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        return function() {
                          var selected_Tool = Session.get("tool_data")[i];
                            console.log(selected_Tool._id);
                            Session.set('currentItem', selected_Tool._id );
                            Session.set('itemFlag', selected_Tool.flag );
                            Session.set('available_date', selected_Tool.available_date );
                            Session.set('currentPage', 'rent-item');
                            Router.go('/rent/detail/'+selected_Tool._id);
                            // Meteor.Router.to('/rentItem');                  

                        }
                      })(marker, i));
                      google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
                        return function() {
                          var selected_Tool = Session.get("tool_data")[i];
                          $("div."+selected_Tool._id).parent().addClass("toolcellmouseover");
                        }
                      })(marker, i));    
                      google.maps.event.addListener(marker, 'mouseout', (function(marker, i) {
                        return function() {
                          var selected_Tool = Session.get("tool_data")[i];
                          $("div."+selected_Tool._id).parent().removeClass("toolcellmouseover");
                        }
                      })(marker, i));                          
                }
            }
        }
        else {
            cosole.log( "cannot attach to google maps");
        }
    }
    catch(err){
        console.log(err);
    }
};
