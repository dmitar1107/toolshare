server_host = "";
Tools = new Meteor.Collection("tools");
ToolCats = new Meteor.Collection("toolcats");
Feedback = new Meteor.Collection("feedback");
Rental = new Meteor.Collection("rental");
Prices = new Meteor.Collection("prices");
Setting = new Meteor.Collection("settings");
Request = new Meteor.Collection("request");
// StripeKey = 'pk_test_oem1r3uOYDmXgaL8OzdR4cVq';

QueryString = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

GetDateTime =  function (datetime) {
    var returnValue = {};
    var DateTime  = datetime.split(" ");
    var date = DateTime[0];
    var time = DateTime[1];
    date = date.split(",");
    time = time.split(",");
    returnValue["date"] = date[0]+"/"+date[1]+"/"+date[2];
    returnValue["time"] = time[0]+" "+time[1];
    return returnValue;
};
UserPubInfos = function () {
    this.init =  function () {
        if (Meteor.user()) {
            this.lat = Meteor.user().profile.address_lat;
            this.lng = Meteor.user().profile.address_lng;
            this.fulladdress = Meteor.user().profile.fulladdress;
        }
        else {
            if (Cookie.get('lat') != undefined && Cookie.get('lng') != undefined && Cookie.get('fulladdress') != undefined) {
                this.lat         = Cookie.get('lat');
                this.lng         = Cookie.get('lng');
                this.fulladdress = Cookie.get('fulladdress');
            }
            else {
                Router.go('/rent/userlocation');
            }
        }
    },
    this.init();
}
Autocomplete = function (element) {
    obj = this;
    this.autocomplete_init = function() {
          element.autocomplete({
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
              obj.update_ui(  ui.item.value, ui.item.geocode.geometry.location )
            }
          });        
    },
    this.update_ui = function( address, latLng ) {
        element.autocomplete("close");
        element.val(address);
        // $('#lat').val(latLng.lat());
        // $('#lng').val(latLng.lng());
    };
};
PaymentProcess = function (callback) {
    this.setupStripeKey = function (name, num, ccv, creditDateMonth, creditDateYear, type) {

        if (Session.get("striepPublishableKey").trim()) {
            Stripe.setPublishableKey(Session.get("striepPublishableKey").trim());
            Stripe.createToken({
                name: name,
                number: num, // string
                cvc: ccv,   // string
                exp_month: creditDateMonth,// creditDateMonth, (testing only)
                exp_year: creditDateYear // creditDateYear (testing only)
            }, this.stripeHandleResponse );            
        }
        else {
            bootbox.alert("Please notify to Administrator the payment has some problems");
        }

    },
    this.stripeHandleResponse = function(status, response) {
        if (response.error) {
            if (callback) {
                $("#creditInfo").modal("hide");
                var message = "Sorry. You have any issue with your payment account. Try again.";
                FlashMessages.sendError(message);
            }
            
        } else {            
            // TODO: store the customer token in the user database
            Meteor.call( 'createCustomer', response.id, Meteor.userId(), function (error, response) {
                if (response ==  true) {
                    $("#creditInfo").modal("hide");
                    progress.hidePleaseWait();                    
                    var message = "Thanks, The credit info are stored successfully.";
                    FlashMessages.sendSuccess(message);
                }
                else {
                    var message = "Sorry, Error happend.";
                    FlashMessages.sendAlert(message);                    
                }
            });
        }
        
    }};

myProgress = function () {
    this.showPleaseWait = function () {
        
        $("#pleaseWaitDialog").modal();
            progressStatus = setInterval(function() {
            $bar = $('.bar');

            if ($bar.width()==270) {
                clearInterval(progressStatus);
                $('.progress').removeClass('active');
            } else {
                $bar.width($bar.width()+27);
            }
            $bar.text(parseInt($bar.width()/2.7) + "%");
        }, 800);         
    },
    this.hidePleaseWait = function () {
        
        clearInterval(progressStatus);
        $('.bar').width("100%");
        $('.bar').text("100%");
        setTimeout(function() {$("#pleaseWaitDialog").modal("hide");$('.bar').width("0%");$('.bar').text("0%");$('.progress').removeClass('active');},2000);
        // $("#pleaseWaitDialog").modal("hide");
    }

}

/*  Delete Session 
*   param: key
*   type : array
*/

deleteSession =  function(key) {
    for (var i = 0; i < key.length; i ++) {
        delete Session.keys[key[i].trim()];
    }
    return true;
};
ajaxLoader = function (el, options) {
   // Becomes this.options
    var defaults = {
        bgColor         : '#fff',
        duration        : 800,
        opacity         : 0.7,
        classOveride    : false
    }
    this.options    = jQuery.extend(defaults, options);
    this.container  = $(el);
    
    this.init = function() {
        var container = this.container;
        // Delete any other loaders
        this.remove(); 
        // Create the overlay 
        var overlay = $('<div></div>').css({
                'background-color': this.options.bgColor,
                'opacity':this.options.opacity,
                'width':container.width(),
                'height':container.height(),
                'position':'absolute',
                'top':'0px',
                'left':'0px',
                'z-index':99999
        }).addClass('ajax_overlay');
        // add an overiding class name to set new loader style 
        if (this.options.classOveride) {
            overlay.addClass(this.options.classOveride);
        }
        // insert overlay and loader into DOM 
        container.append(
            overlay.append(
                $('<div></div>').addClass('ajax_loader')
            ).fadeIn(this.options.duration)
        );
    };
    
    this.remove = function(){
        var overlay = this.container.children(".ajax_overlay");
        if (overlay.length) {
            overlay.fadeOut(this.options.classOveride, function() {
                overlay.remove();
            });
        }   
    }

    this.init();    
};
redirectTo = function (param) {
    Router.go(param);
};

getHour = function(date) {
    var time = new Array;
    var hours = date.split(" ")[1];
    hour = parseFloat(hours.split(":")[0]);
    var min = parseFloat(hours.split(":")[1]);
    // min = parseFloat(min.split(",")[0]);
    var zone = date.toString().search("PM");
    if (zone != -1) {
        hour = parseInt(hour + 12);
    }
    time["hour"] = hour;
    time["min"] = min;
    return time;
};

activaTab = function(tab) {
    $('.nav-tabs a[href="#' + tab + '"]').tab('show');
};

getToolThumbnail = function (id) {
    var thumbnail = Tools.find({_id: id}).fetch()[0].thumbnail;
    if (thumbnail)
        return thumbnail;
    else
        return "";    
};
getToolImg = function (id) {
    var img = Tools.find({_id: id}).fetch()[0].img;
    if (img)
        return img;
    else
        return "";        
};
getToolName = function (id) {
    var name = Tools.find({_id: id}).fetch()[0].toolname;
    if (name)
        return name;
    else 
        return  "";
};
getToolDesc = function (id) {
    var desc = Tools.find({_id: id}).fetch()[0].tooldesc;
    if (desc)
        return desc;
    else 
        return  "";
};
getToolCat = function (id) {
    var cat =ToolCats.find({_id: id}).fetch()[0].categories;
    if (cat)
        return cat;
    else
        return "";
};
getToolCatId = function (id) {
    var cat =Tools.find({_id: id}).fetch()[0].toolcat;
    if (cat)
        return cat;
    else
        return "";    
};
getUserFullName = function (userid) {
    var fullname = Meteor.users.find({_id: userid}).fetch()[0].profile.fullname;
    if (fullname)
        return fullname;
    else
        return "";
};
getFormatedDates = function (date) {
    if (date){
        var dates = date.split(" ")[0];
        var time = date.split(" ")[1];
        return dates.split(",")[1]+"/"+dates.split(",")[0]+"/"+dates.split(",")[2]+ " " + time.split(",")[0]+" "+ time.split(",")[1];
    }
    else {
        return "";
    }
};

getSplitedDates = function(date) {
    var value = new Array;
    var hours = date.split(" ")[1];
    var dates = date.split(" ")[0];
    dates = dates.split("/");
    hour = parseFloat(hours.split(":")[0]);

    var min = parseFloat(hours.split(":")[1]);
    // min = parseFloat(min.split(",")[0]);
    var zone = date.toString().search("PM");
    if (zone != -1) {
        hour = parseInt(hour + 12);
    }
    value["year"] = dates["2"];
    value["month"] = dates["1"];
    value["date"] = dates["0"];
    value["hour"] = hour;
    value["min"] = min;
    return value;
};

getSplitedDatesFromFormat = function (date) {
    date = date.split("/");
    return date[0]+","+date[1]+","+date[2];
}
/* Array Prototype for Min and Max */

Array.prototype.max =  function () {
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    return Math.min.apply(null, this);  
}




if (Meteor.isClient) {

    App = {
        subs : {
            Tools: Meteor.subscribe("getTools"),
            Rental: Meteor.subscribe("allRentalData")
        }
    };
    Meteor.call('getEnv', function(error, result) {
        server_host = result+"/";
    });
    Server_status = Meteor.status();
    Meteor.subscribe("allUserData");
    Meteor.startup(function () {
        progress = new myProgress();
        console.log("*** Startup ***");
        Session.set( 'searchFilter', {});
        Session.set('sortby_bestmatch', "2");
        Session.set('sortby_distance', "0");
        Session.set("trackForReservePage", null);
        Session.set( 'login Status', Meteor.user());
        Session.set( 'expandUser', false );
        Session.set("adminTab", "");
        Deps.autorun(function () {
            Meteor.subscribe("getToolCats");
            var cats = ToolCats.find({}).fetch();
            if (cats) {
                var list = [];
                for (var  i = 0; i < cats.length; i ++) {
                    var obj = {};
                    obj.value = cats[i]._id;
                    obj.text = cats[i].categories;
                    list.push(obj);
                }
                Session.set("toolcategories", list);
            }
        });
        Meteor.call( "getPublicStipeKey", function (error, result) {
            if (result) {
                Session.set("striepPublishableKey", result);
            }
        });
    });
    Router.configure({
      layoutTemplate: 'layout'
    });   
    Router.map(function () {
      this.route('home', {
        path: '/',
        template: 'home'
      });   
      this.route('user', {
        path: '/user/login',
        template: 'newuser'
      });  
      this.route('user', {
        path: '/user/newuser',
        template: 'createNewUser'
      });          

      this.route('rent', {
        path: '/rent/userlocation',
        template: 'userlocation'
      }); 
      this.route('rent', {
        path: '/rent/list',
        template: 'rentListView',
        loading: 'loadingTemplate',
        notFound: 'notFoundTemplate',        
      });  
      this.route('rentReserve', {
        path: '/rent/reserve',
        template: 'rentReserveView'
      });      
      this.route('loan', {
        path: '/loan/dashboard',
        template: 'loanViewDashboard'
      });
      this.route('loan', {
        path: '/loan/view',
        template: 'loanView',
        waitOn: function () {
            return Meteor.subscribe('getPrices');
        },
      });

      this.route('social', {
        path: '/social',
        template: 'shareSocial'
      });

      this.route('news', {
        path: '/news',
        template: 'news'
      });


      this.route('admin', {
        path: '/admin/view',
        template: 'adminView',
        waitOn: function () {
            return Meteor.subscribe('getSettings');
        },        
      });
     this.route('rentDetail', {
        path: '/rent/detail/:_id',
        template: 'rentItemView',
        waitOn: function () {
            return Meteor.subscribe('getTools');
        },
        data: function () {
            Session.set('currentItem', this.params._id);
        }
      });
      this.route('reserveConfirm', {
        path: '/confirm/reserve/:_id',
        loadingTemplate: 'loading',
        template: 'loanConfirms',
        data: function () {
            Session.set('rental_param', this.params._id);
        }        
      });      
      this.route('pickupConfirm', {
        path: '/confirm/pickup/:_id',
        loadingTemplate: 'loading',
        template: 'pickupConfirm',
        data: function () {
            Session.set('rental_param', this.params._id);
        }        
      });      
      this.route('returnConfirm', {
        path: '/confirm/return/:_id',
        loadingTemplate: 'loading',
        template: 'returnConfirm',
        data: function () {
            Session.set('rental_param', this.params._id);
        }        
      });
      this.route('sendFeedback', {
        path: '/confirm/sendfeedback/:_id',
        loadingTemplate: 'loading',
        template: 'sendFeedback',
        data: function () {
            Session.set('rental_param', this.params._id);
        }        
      });
      this.route('sendRentFeedback', {
        path: '/confirm/sendrentfeedback/:_id',
        loadingTemplate: 'loading',
        template: 'sendrentfeedback',
        data: function () {
            Session.set('rental_param', this.params._id);
        }        
      });         
      this.route('myrentals', {
        path: '/rental/rented',
        template: 'myrentals',
        waitOn: function ( ) {
            App.subs.Rental;
            App.subs.Tools;
        }
      });
      this.route('rentaldetail', {
        path: '/rental/details/:_id',
        loadingTemplate: 'loading',
        template: 'rentalDetail',
        data: function () {
            Session.set('myRentalId', this.params._id);
        },           
        waitOn: function ( ) {
            App.subs.Rental;
            App.subs.Tools;
        },
        before: function () {
            var flag = Rental.find({_id: this.params._id}).fetch()[0].flag;

            switch (flag){
                case 0:
                    // Session.set("rentalType", "reserved");
                    Session.set("rentalType", "reserved");
                    break;
                case 1:
                    Session.set("rentalType", "active");
                    break;
                case 2:
                    Session.set("rentalType", "completed");
                    break;
                case 3:
                    Session.set("rentalType", "completed");
                    break;                
            }
        }        
      });
      this.route('myaccount',{
        path:'/myaccount/edituser',
        template:'edituser'
      });
    })
 //    Meteor.Router.add({
 //        '/': 'home',
    //  '/newuser': 'loginView',
 //        '/social': 'shareSocial',
 //        '/news': 'news',
 //        '/about': 'about',
 //        '/contact': 'contact',
 //        '/rent': 'rentView',
 //        '/rentItem': 'rentItemView',
 //        '/loan': 'loanView',
 //        '/pickupConfirm': 'pickupConfirm',
 //        '/renturnConfirm': 'renturnConfirm',
 //        '/sendfeedback': 'sendFeedback',
 //        '/sendrentfeedback': 'sendrentfeedback',
    //  '/loanConfirm': function() {
    //      return 'loanConfirm';
    //  },
 //        '/rentReserve': 'rentReserveView',
 //        '/admin': 'adminView',
 //        '/test/:id': function(id) {
 //            console.log( "got it" );
 //            console.log('we are at ' + this.canonicalPath);
 //            console.log("our parameters: " + this.params);
 //            console.log("id" + id );
 //        },
 //        '*': 'not_found'
 //    });

 //    Meteor.Router.filters({
 //        'checkLoggedIn': function(page) {
 //            if (Meteor.user()) {
 //               return page;
 //            }
 //            else {
 //                return 'loginView';
 //            }
    //  },
    // });

    Template.toolList.tools = function() {
        console.log(Session.get("searchFilter"));
        Deps.autorun( function () {
            Meteor.subscribe("allRentalData");
            console.log(Session.get( 'searchFilter' ));
            if (Meteor.user() != null) {
                var userdata = Meteor.user();
                Session.set( '', userdata.profile.firstname);
                Session.set( 'currentUser_LNcurrentUser_FNameame', userdata.profile.lastname );
                Session.set( 'currentUser_Email', userdata.emails[0].address );
                
                if (Cookie.get('lat') && Cookie.get('lat') && Cookie.get('fulladdress')) {
                    Session.set( 'currentUser_lat', Cookie.get('lat'));                            
                    Session.set( 'currentUser_lng', Cookie.get('lng'));
                    Session.set( 'currentUser_fulladdress', Cookie.get('fulladdress'));
                }
                else {
                    Session.set( 'currentUser_lat', userdata.profile.address_lat);                            
                    Session.set( 'currentUser_lng', userdata.profile.address_lng);
                    Session.set( 'currentUser_fulladdress', userdata.profile.fulladdress);                
                }
                if (Session.get( 'sortby_price' ) == "0" || Session.get( 'sortby_price' ) == undefined) {
                    var tool_data = Tools.find({$and:[{userid: {$ne: Meteor.userId()}}, {active: true}, Session.get( 'searchFilter' )]}).fetch();
                    setSortForDistance(tool_data);
                }
                else if (Session.get( 'sortby_price' ) == "1") {
                                        // console.log(Session.get("searchFilter"));
                    var tool_data = Tools.find({$and:[{userid: {$ne: Meteor.userId()}}, {active: true}, Session.get( 'searchFilter' )]}, {sort: {price: 1} }).fetch();
                    setSortForDistance(tool_data);                   
                }
            }
            else {

                if (Session.get( 'sortby_price' ) == "0" || Session.get( 'sortby_price' ) == undefined) {
                    var tool_data = Tools.find(Session.get( 'searchFilter' )).fetch();
                    setSortForDistance(tool_data);
                }
                else if(Session.get( 'sortby_price' ) == "1") {
                    var tool_data = Tools.find(Session.get( 'searchFilter' ), {sort: {price: 1} }).fetch();
                    setSortForDistance(tool_data);
                }
                setSortForDistance(tool_data);
                Session.set( 'currentUser_lat', Cookie.get('lat'));  
                Session.set( 'currentUser_lng', Cookie.get('lng'));
                Session.set( 'currentUser_fulladdress', Cookie.get('fulladdress'));
            }
        });
        if (Session.get("tool_data")) {
            return Session.get("tool_data");
        }
    };
    function setSortForDistance(tool_data) {
        if (tool_data != "") {
            for (var  i = 0; i < tool_data.length; i ++) {
                var rentals = Rental.find({$and: [{toolId:tool_data[i]._id}, {flag: {$ne: "3"}}]}).fetch();
                console.log(rentals);
                var dist = getdistance(Session.get( 'currentUser_lat'), Session.get( 'currentUser_lng'), parseFloat(tool_data[i].lat), parseFloat(tool_data[i].lng));
                tool_data[i].dist = dist.toFixed(2);
                if (rentals[0]){
                    tool_data[i].flag = 1;
                    tool_data[i].available_date = rentals[0].endDate;
                }
                else{
                    tool_data[i].flag = 0;
                }
            }
            console.log("distance = " + Session.get('sortby_distance'));
            if (Session.get('sortby_distance') == "1") {
                tool_data.sort( function (a, b) {
                    return a.dist-b.dist;
                });    
            }
            // else if (Session.get('sortby_distance') == "0"){
            //     tool_data.sort( function (a, b) {
            //         return b.dist-a.dist;
            //     });
            // }
            Session.set("tool_data", tool_data);
        } 
    }
    Template.searchBar.events({
        'click input.searchBarEdit': function () {
            console.log("*** Searchbar Click ***");
        },

        'click input.searchBarSubmit_btn': function () {
            console.log("*** Submit Click ***" );
            Session.set( 'searchFilter', {name:{$regex: document.getElementById("searchBarEdit").value, $options: 'i'  } } );
        }

    });

    Template.header.events({
        'click span.header_click': function () {
            console.log("*** Header Click ***");
            Session.set( 'currentPage', 'home' );
        }
    });
    
    function getdistance(lat1, lon1, lat2, lon2){
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var radlon1 = Math.PI * lon1/180;
        var radlon2 = Math.PI * lon2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if(isNaN(dist))
            dist = 0;
        return dist;
    };

}


/************************ Client and Server **********************************/
MeteorFile = function (options) {
  options = options || {};
  this.name = options.name;
  this.type = options.type;
  this.size = options.size;
  this.source = options.source;
};

MeteorFile.fromJSONValue = function (value) {
  return new MeteorFile({
    name: value.name,
    type: value.type,
    size: value.size,
    source: EJSON.fromJSONValue(value.source)
  });
};

MeteorFile.prototype = {
  constructor: MeteorFile,

  typeName: function () {
    return "MeteorFile";
  },

  equals: function (other) {
    return
      this.name == other.name &&
      this.type == other.type &&
      this.size == other.size;
  },

  clone: function () {
    return new MeteorFile({
      name: this.name,
      type: this.type,
      size: this.size,
      source: this.source
    });
  },

  toJSONValue: function () {
    return {
      name: this.name,
      type: this.type,
      size: this.size,
      source: EJSON.toJSONValue(this.source)
    };
  }
};

EJSON.addType("MeteorFile", MeteorFile.fromJSONValue);
/*****************************************************************************/

/************************ Client *********************************************/
if (Meteor.isClient) {
  _.extend(MeteorFile.prototype, {
    read: function (file, callback) {
      var reader = new FileReader;
      var meteorFile = this;

      callback = callback || function () {};

      reader.onload = function () {
        meteorFile.source = new Uint8Array(reader.result);
        callback(null, meteorFile);
      };

      reader.onerror = function () {
        callback(reader.error);
      };

      reader.readAsArrayBuffer(file);
    }
  });

  _.extend(MeteorFile, {
    read: function (file, callback) {
      return new MeteorFile(file).read(file, callback);
    }
  });
}
/*****************************************************************************/

