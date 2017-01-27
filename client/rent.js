/**
 * Created with JetBrains WebStorm.
 * User: dennismerrill
 * Date: 12/30/12
 * Time: 7:43 PM
 * To change this template use File | Settings | File Templates.
 */
var date = new Date();
var ONE_HOUR = 60 * 60 * 1000; /* ms */
var pickupDate = new Date(date.getTime() + ONE_HOUR);
var yy = pickupDate.getFullYear();
var mm = pickupDate.getMonth()+1;
var dd = pickupDate.getDate();
var hr = pickupDate.getHours(); 
var min = pickupDate.getMinutes();

    Template.userlocation.rendered = function() {
        if (Meteor.user() != null || (Cookie.get('lat') && Cookie.get('lat') && Cookie.get('fulladdress'))) {
            Router.go('/rent/list');
        }     
        try {
            if(google) {
                var autocomplete = new Autocomplete($("#fulladdress"));
                autocomplete.autocomplete_init();  
            }
        }
        catch(err){
            console.log(err);
        }   
    };
    Template.userlocation.events({
        'click #keepmecheck': function () {
            var value = document.getElementById("keepmecheck").checked;
            if (value == true)
                document.getElementById("email").disabled = false;
            else
                document.getElementById("email").disabled = true;
        },        
        'click .rentLocationSubmit_btn' : function( ) {
            var address = document.getElementById("fulladdress").value;
            if(address) {
                var geocoder = new google.maps.Geocoder();
                try {
                    if ( google != null ) {
                        var geocoder = new google.maps.Geocoder();
                        geocoder.geocode( { 'address': address}, function(results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                document.cookie = 'lat='+results[0].geometry.location.lat();
                                document.cookie = 'lng='+results[0].geometry.location.lng();
                                document.cookie = 'fulladdress='+address;

                                var value = document.getElementById("keepmecheck").checked;
                                if (value == true) {
                                    var test = validateEmail(document.getElementById("email").value);
                                    if (test == true) {
                                        Meteor.call("collectionMails", document.getElementById("email").value)
                                    }
                                    else {
                                        var message = "Please Type your correct mail address.";
                                        FlashMessages.sendError(message, { hideDelay: 1500 });
                                        return false;
                                    }
                                }
                                Router.go('/rent/list');
                                // Session.set( 'currentPage', 'rent-list');
                                return false;

                            } else {
                                var message = "Please set correct location.";
                                FlashMessages.sendError(message, { hideDelay: 1500 });                        
                                return false;
                            }
                        });
                    }            
                }
                catch(err){
                    console.log(err);
                }
            }
            else {
                if (Cookie.get('lat') && Cookie.get('lng')) {
                   var value = document.getElementById("keepmecheck").checked;
                    if (value == true) {
                        var test = validateEmail(document.getElementById("email").value);
                        if (test == true) {
                            Meteor.call("collectionMails", document.getElementById("email").value)
                        }
                        else {
                            var message = "Please Type your correct mail address.";
                            FlashMessages.sendError(message, { hideDelay: 1500 });
                            return false;
                        }
                    }    
                    Router.go('/rent/list');                
                     // Session.set( 'currentPage', 'rent-list');   
                }
                else {
                    if (Meteor.user() != null) {
                        document.cookie = 'lat='+Meteor.user().profile.address_lat;
                        document.cookie = 'lng='+Meteor.user().profile.address_lng;
                        document.cookie = 'fulladdress='+Meteor.user().profile.fulladdress;
                        Router.go('/rent/list');
                        // Session.set( 'currentPage', 'rent-list');
                        return false;
                    }
                    else {
                        var message = "Please set location.";
                        FlashMessages.sendError(message, { hideDelay: 1500 });
                        return false;                
                    }
                }
            }
        }
    });
    

    Template.rentListView.rendered = function () {
        Session.set('itemFlag', 0 );
        Session.set('available_date', "" );
    };
    Template.rentListView.events({
        'click .rentCell': function () {
            Session.set('itemFlag', this.flag );
            Session.set('available_date', this.available_date );
            Session.set('currentPage', 'rent-item');

            var sessions = [];
            sessions.push("tool_data");
            sessions.push("currentUser_lat");
            sessions.push("currentUser_lng");
            sessions.push("currentUser_fulladdress");
            sessions.push("sortby_price");
            sessions.push("currentUser_LNcurrentUser_FNameame");
            sessions.push("currentUser_Email");
            deleteSession(sessions);

            Router.go('/rent/detail/'+this._id);
        },
        'mouseover .rentCell': function() {
            try {
                var tool = Tools.find({_id: this._id}, {fields: {'lat': 1, 'lng': 1}}).fetch()[0];
                if (tool) {
                    var latLng = new google.maps.LatLng(tool.lat, tool.lng);
                    map.setCenter(latLng);
                }
            }
            catch (err){
                console.log(err)
            }
        },
        'click .checkAvailability_btn': function () {
            Meteor.call('sendEmail',
                'dennis.e.merrill@gmail.com',
                'bob@example.com',
                'Hello from ' + Session.get('currentFName'),
                'This is a test of Email.send.');
        }

    });
    
    Template.rentItemView.events({
        'click #check_availability': function () {
            // asynchronously send an email
            Meteor.call('sendEmail',
                $("#email").html(),
                'dennis.e.merrill@gmail.com',
                'Subject',
                'This is a test of Email.send.');
            },
            'click .readmore': function() {
                document.getElementById("tooldesc").style.maxHeight = "100%";
            },
            'click #reserve': function() {
                if (Meteor.user() == null) {
                    Session.set( 'trackForRouter','/rent/reserve');
                    Router.go('/user/login');
                }                   
                else {
                    Session.set("tool_price", document.getElementById("week_price").value);
                    Router.go('/rent/reserve');                                 
                }
            },
            'click #back': function() {
                Session.set( 'currentPage', 'rent-list');
                Meteor.Router.to('/rent'); 
            }
    });

    Template.rentItemView.getRenterName =  function (id) {
        var user = Meteor.users.find({_id: id}).fetch()[0];
        if (user) {
            return user.profile.fullname;
        }
    }
    Template.rentItemView.rendered = function () {
        if (Session.get("itemFlag") == "1")
        {
            var date = new Date(Session.get('available_date'));
            $(".rentedOut_message").html("This tool will become available on "+ parseFloat(date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear() + " "+ date.getHours()+":"+date.getMinutes());
            $(".rentedOut_message").css("padding", "5px");
            // $('#reserve').prop('disabled', true);
        }

        var showChar = 280;
        var ellipsestext = "...";
        var moretext = "more";
        var lesstext = "less";
        $("#more").bind("click", function () {
            var val = $(this).attr("value");
            val = parseInt(parseInt(val) + 3);
            $("#more").attr("value", val);
            // var toolid = document.getElementById("toolid").value;
            var object = getFeedbackList(Session.get('currentItem'), val);
            var areaheight = parseInt($("#accordion2").css("height"));
            areaheight = areaheight + object.length*83;
                        
            $("#accordion2").css("height", areaheight+"px");
            var fragment = Meteor.render(
              function () {
                var html = "";
                for(var i = 0; i < object.length; i ++) {
                    html += "<div class='feedbackarea'><p class='feedback'>"+object[i].text+"</p><p class='feedbackusername'>"+object[i].getRenter+"</p></div>"
                }
                $("#feedbacks").append(html);
              });                        
        });
        $('.more').each(function() {
            var content = $(this).html();

            if(content.length > showChar) {

                var c = content.substr(0, showChar);
                var h = content.substr(showChar-1, content.length - showChar);

                var html = c + '<span class="moreelipses">'+ellipsestext+'</span>&nbsp;<span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink">'+moretext+'</a></span>';

                $(this).html(html);
            }

        });

        $(".morelink").click(function(){
            if($(this).hasClass("less")) {
                $(this).removeClass("less");
                $(this).html(moretext);
            } else {
                $(this).addClass("less");
                $(this).html(lesstext);
            }
            $(this).parent().prev().toggle();
            $(this).prev().toggle();
            return false;
        });
        // var toolid = $("#toolid").val();
        Deps.autorun( function () {
            Meteor.subscribe("getAllFeedback");
            var tools = Tools.find({_id: Session.get('currentItem')}).fetch()[0];
            if (tools) {
                var feedback = Feedback.find({"loaner.userid": tools.userid});
                if (feedback.count() > 0) {
                    var marks = 0;
                    feedback.forEach( function (data) {
                        if (data.renter.marks){
                            marks = marks + parseFloat(data.renter.marks); 
                        }
                    });
                    Session.set("tool_rating", parseFloat(marks)/parseFloat(feedback.count()));
                }
            }
        });
        $('#star').raty({ score: Session.get("tool_rating"), readOnly: true });
        $('.accordion').collapse();   
        

        $('.accordion').on('shown hidden', function(e){
            if ($(e.target).siblings('.accordion-heading').find('.accordion-toggle').attr("href") == "#collapseOne" && $(e.target).siblings('.accordion-heading').find('.accordion-toggle i').attr("class") =="icon-arrow-up") {
                $("#accordion2").css("height", 300+"px");
            }
            else if ($(e.target).siblings('.accordion-heading').find('.accordion-toggle').attr("href") == "#collapseOne" && $(e.target).siblings('.accordion-heading').find('.accordion-toggle i').attr("class") =="icon-arrow-down") {
                var count = $("#feedbacks .feedbackarea").length;
                var height = 300+83*parseInt(count);
                $("#accordion2").css("height", height+"px");
                           
            }
            $(e.target).siblings('.accordion-heading').find('.accordion-toggle i').toggleClass('icon-arrow-down icon-arrow-up');
        });
        if (Session.get("ItemFeedbackCoun") < 4) {
            $("#more").hide();
        }
        initialize();
    };
    Template.rentView.serveCurrentIs = function( comp ) {
        console.log("** serveCurrentIs ***" + Session.get('currentPage'));
      if (Session.get('currentPage') == "homePage" || Session.get('currentPage') == undefined) {
            Session.set("currentPage", "rent-list");
        }        
        return ( Session.get( 'currentPage' ) === comp );
    };

    Template.rentItemView.getCurrentItem = function () {
        return Tools.find({_id:Session.get('currentItem')}).fetch()[0];
    };
    
    Template.rentItemView.similartools = function (id, cat) {
        return Tools.find({$and: [{toolcat: cat}, {_id:{$not: id}}]}, {limit: 3}, {rentDetailssort: {tooldesc: 1} } );  
    };
    Template.rentItemView.getFeedbacks = function (id) {
        var feedback_list = getFeedbackList(id);
        return feedback_list;
    };
    Template.rentReserveView.getRserveData =  function() {
        var tool = Tools.find({_id: Session.get('currentItem')}).fetch()[0];
        if (Session.get('currentItem') == undefined || tool == undefined){
            Router.go("/rent/list");
        }
        return tool;
    };
    Template.rentReserveView.rendered = function () {
        // console.log(Rental);
        // var rental = Rental.find({$and:[{toolId:Session.get('currentItem')}, {$ne: {flag: "3"}}]}).fetch()[0];
        var rental = Rental.find({$and:[{flag: {$ne: "3"}}, {toolId: Session.get('currentItem')}]});
        if (rental.count() > 0) {
            var rental_obj = rental.fetch()[0];
            var toolEndDate = new Date();
            var hour = getHour(rental_obj.endDate)["hour"];
            var year = parseFloat(rental_obj.endDate.split(",")[2]);
            var month = parseFloat(rental_obj.endDate.split(",")[0]);
            var date = parseFloat(rental_obj.endDate.split(",")[1]);
            var min = getHour(rental_obj.endDate)["min"];            
            var endDate = new Date(year, month-1, date, hour, min, 0, 0 );
            var today = new Date();
            var diff = endDate - today;
            diff = new Date(diff);
            // alert(rental.fetch()[0].endDate);
            $('#datepicker1').datepicker({
                startDate: "+"+diff.getDate()+"d"
            });
            $('#datepicker2').datepicker({
                startDate: "+"+diff.getDate()+"d" 
            });
        }
        else {
            $('#datepicker1').datepicker();
            $('#datepicker2').datepicker();
        }
        $('#timepicker1').timepicker('setTime', '00:00 AM');        
        
        $('#timepicker2').timepicker('setTime', '00:00 AM');
    };
    Template.rentReserveView.events({
        'click #reserver_back': function (){
            Router.go('/rent/detail/'+this._id);
            // Session.set('currentPage', 'rent-list');
            // Meteor.Router.to('/rent');
        },
        'click #save_credit': function () {
            var paymentNumber = $("#paymentNumber").val();
            var expires = $("#expires").val();
            var paymentName = $("#paymentName").val();
            var paymentCVC = $("#paymentCVC").val();
            var payment = new PaymentProcess(callback=true);
            payment.setupStripeKey(paymentName, paymentNumber, paymentCVC, expires.split("-")[0], expires.split("-")[1]);
            $('#timepicker1').timepicker('setTime', '00:00 AM');        
            $('#timepicker2').timepicker('setTime', '00:00 AM');            
                                    
        },
        'click #reserve': function () {
            var price = calculPrice();
            Session.set("real_price", price);
            Meteor.call("getChargePrice",Session.get("real_price"), function (error, price) {
                bootbox.confirm("You will receive a confirmation with pickup location once the reservation has been confirmed with $"+price+".", function(result) {
                    if( result === true){
                        var rent_user = Meteor.user();
                        //TODO: checknig user customer key
                        if (rent_user.profile.customerId) {
                                sendLoanConfirmMail(rent_user);
                        }
                        else {
                            $('#ccDate').datepicker();
                            $("#reserveModal").modal("hide");
                            $("#creditInfo").modal();
                        }                    
                    }
                });
            });
        }
    });
    Template.rentReserveView.tooldistance = function() {
        var data = Tools.find({_id:Session.get('currentItem')}).fetch()[0]
        var userdata = Meteor.user();
        var dist = getdistance(userdata.profile.address_lat, userdata.profile.address_lng, data.lat, data.lng);
        var mile = (dist*100000)*(1/2.54)*(1/63360);
        return mile.toFixed(2);
    };

    Template.rentReserveView.today = function() {
        console.log("Today = " + mm+"/"+dd+"/"+yy);
        return mm+"/"+dd+"/"+yy;
    };    
    function getFeedbackList (id, first) {
        if ( first == undefined) {
            first = 0;
        }
        var items = Feedback.find({"loaner.userid": id}, {sort: {date: -1}}).fetch();
        var end = parseInt(parseInt(first) + 3);
        Session.set("ItemFeedbackCoun", items.length);
        // console.log(items.slice(first, end));
        return items.slice(first, end);
    }
    function getdistance(lat1, lon1, lat2, lon2){
        var R = 6371; // km
        var dLat = (lat2-lat1)*Math.PI / 180;
        var dLon = (lon2-lon1)*Math.PI / 180;
        var lat1 = lat1*Math.PI / 180;
        var lat2 = lat2*Math.PI / 180;

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;
        return d;
    };    

    Template.searchBar.rendered = function () {
        Deps.autorun(function () {
            Meteor.subscribe("getTools");
            if (Meteor.user() == null){
                var data_source = Tools.find({},{fields: {"toolname": 1}}).fetch();
            }
            else{
                var data_source = Tools.find({userid: {$ne: Meteor.userId()}}, {fields: {"toolname": 1}}).fetch();
            }
            if (data_source) {
                Deps.autorun(function () {
                    var json_array = new Array;
                    var p = 1;
                    var data = "";                  
                    var list = [];
                    for (var  i = 0; i < data_source.length; i ++) {
                        var obj = {};
                        obj.id = data_source[i]._id;
                        obj.name = data_source[i].toolname;            
                        list.push(obj);
                    }
                    if (list != ""){
                        $('#searchInput').typeahead({
                            source:list,
                            display: 'name'
                        });   
                        
                    }
                });
                
            }
            
        });
        $('#sort').multiselect({
            buttonWidth: '250px',
            buttonText: function(options) {
            if (options.length == 0) {
                return 'Sort <b class="caret"></b>';
            }
            else {
                var selected = '';
                options.each(function() {
                    selected += $(this).text() + ', ';
                });
                return selected.substr(0, selected.length -2) + ' <b class="caret"></b>';
            }
            },
            onChange:function(element, checked){
                switch(element.val()){
                    case "1":
                        if (checked == true)
                            Session.set('sortby_bestmatch', "1");
                        else
                            Session.set('sortby_bestmatch', "0");
                        break;
                    case "2":
                        if (checked == true)
                            Session.set('sortby_distance', "1");
                        else 
                            Session.set('sortby_distance', "0");   
                        break;
                    case "3":
                        if (checked == true)
                            Session.set( 'sortby_price', "1");
                        else 
                            Session.set('sortby_price', "0");
                        break;
                }
            }                               
        }); 

    };
    Template.searchBar.events({
        'click #search_btn': function () {
           var search_text = document.getElementById("searchInput").value;
           if (search_text) {
             Session.set( 'searchFilter', {toolname:{$regex: search_text}} );
           }
           else {
             Session.set( 'searchFilter', {} ); 
           }
        },
        'click #get_directions': function () {
            var search_text = document.getElementById("searchInput").value;
            if (search_text) {

            }
            else {
                return true;
            }
        },
        'click #s_match': function () {
            if (document.getElementById("s_match").checked == true){
               Session.set('sortby_bestmatch', "1");
            }
            else {
               Session.set('sortby_bestmatch', "2");
            }
            
        },
        'click #s_distance': function () {
            if (document.getElementById("s_distance").checked == true){
               Session.set('sortby_distance', "1");
            }
            else {
               Session.set('sortby_distance', "2");
            }
        },
        'click #s_price': function () {
            if (document.getElementById("s_price").checked == true){
                 Session.set( 'sortby_price', {sort: {price: -1} });
            }
            else {
               Session.set('sortby_price', {});
            }
        }                              
    });
    function autocomplete_init (){

    };
    function sendLoanConfirmMail(rent_user) {
        
        var tool_obj = Tools.find({_id: Session.get('currentItem')}).fetch();
        var loan_user = Meteor.users.find({_id: tool_obj[0].userid}).fetch();
        
        //TODO: Checking Date Value is reasonable for the tool //
        

        var on = Math.floor(Session.get("tool_rating"));
        var half = Session.get("tool_rating") - on;
        var star_rating = "";
        
        for(var i = 0; i < on; i ++) {
            star_rating += '<img class=one_image style="vertical-align: bottom" src='+server_host+'/star-on.png />';
        }
        if (half > 0) {
            star_rating += '<img class=half_image style="vertical-align: bottom" src='+server_host+'/star-half.png />';
        }
        var current_date = new Date();
        var date1 = $("#datepicker1").val();
        var time1 = $("#timepicker1").val();
        var date2 = $("#datepicker2").val();
        var time2 = $("#timepicker2").val();
        
        var time1 = time1.split(" ");
        var first_time = time1[0].split(":");
        var time2 = time2.split(" ");
        var second_time = time2[0].split(":");
        
        if (time1[1] == "PM") {
            var first_hr = parseInt(first_time[0]) +  12;
        }
        else {
            var first_hr = parseInt(first_time[0]);
        }
        if (time2[1] == "PM"){
            var second_hr = parseInt(second_time[0]) +  12;
        }
        else {
            var second_hr = parseInt(second_time[0]);
        }
        date1 = date1.split("/");
        date2 = date2.split("/");

        var id = Rental.insert({toolId: Session.get('currentItem'), rentuserId: rent_user._id, loanuserId: tool_obj[0].userid, pickupDate: date1+" "+time1, endDate: date2+" "+time2, price: Session.get("real_price"), flag: 0});
        // var id = Rental.insert({toolId: Session.get('currentItem'), rentuserId: rent_user._id, loanuserId: tool_obj[0].userid, pickupDate: $("#datepicker1").val() + " " + $("#timepicker1").val(), endDate: $("#datepicker2").val() + " " + $("#timepicker2").val(), price: Session.get("real_price"), flag: 0});

        
        var html = "";
        html += "<div style='width: 600px;'>";
            html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'><a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a></p>";
            html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
                html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>"+rent_user.profile.fullname+" has offered to rent tool</p>";
                html += "<div style='width: 500px;display: block;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
                    html += "<div style='display: inline-block;margin-left: 40px;'>";
                        html += "<p style='font-weight: bold;'>Pickup Date: "+$("#datepicker1").val()+"</p>";
                        html += "<p style='font-weight: bold;'>Return Date: "+$("#datepicker2").val()+"</p>";
                    html += "</div>";
                    html += "<div style='display: inline-block; margin-left: 70px;vertical-align: top;'>";
                        html += "<p style='word-wrap: break-word;font-weight: bold;'>You will Earn</p>";
                        html += "<p style='text-overflow: ellipsis;width: 80px; text-align: center'>$"+Session.get("real_price")+"</p>";
                    html += "</div>";
                    html += "<div style='height: 60px;'>";
                        html += "<div style='margin-left: 40px;display: inline-block;vertical-align:top;'>User Rating: </div>";
                        html += "<div style='width: 100px;display: inline-block;'>"+star_rating?star_rating:"No Feedback"+"</div>";
                    html += "</div>";
                    html += "<div align='center'>";
                        html += "<a href='"+server_host+"confirm/reserve/"+id+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Respond to this Request</a>";
                    html += "</div>";
                html += "</div>";
            html += "</div>";
        html += "</div>";
        Meteor.call('sendEmail',
            loan_user[0].emails[0].address,
            rent_user.emails[0].address,
            'New Rental Confirmation from Eqwip.It',
            '', html);
        console.log("Sent Mail");
        $("#reserveModal").modal("hide");
        $('#reserve').prop('disabled', true);
     
    };

    // Finds the closest price of a competitor in Prices database
    Template.rentItemView.findClosestPrice = function( comp, desc, cat ) {
        // console.log( comp + " - " + desc + " - " + cat + " - " + Prices);
        Meteor.subscribe("getPrices");
        var ret = Prices.findOne( {company:comp} );
        if ( !ret )
            ret = "N/A";
        else
            ret = "$" + ret.price + "/wk";
        return ret;
    };
    function validateEmail(email) { 
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    };
    function initialize(){
        
        var tool = Tools.find({_id:Session.get('currentItem')}).fetch()[0];
        if (tool) {
            var tool_fulladdress = tool.fulladdress;   
            var tool_lat = tool.lat;
            var tool_lng = tool.lng;
            var tool_img = tool.thumbnail;
            var userPubInfo = new UserPubInfos();
            var user_lat = userPubInfo.lat;
            var user_lng = userPubInfo.lng;
            var user_fulladdress = userPubInfo.fulladdress;


            // var user_lng = Session.get("currentUser_lng");
            // var user_fulladdress = Session.get("currentUser_fulladdress")?Session.get("currentUser_fulladdress"):Cookie.get('fulladdress');
            if (user_lat && user_lng && user_fulladdress) {
                try {
                    if ( google != null ) {
                            directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
                            directionsService = new google.maps.DirectionsService();
                            var mapOptions = {
                                center: new google.maps.LatLng(tool_lat, tool_lng),
                                zoom: 2,
                                mapTypeId: google.maps.MapTypeId.ROADMAP
                            };      
                            map = new google.maps.Map($("#detail_map")[0], mapOptions);
                            directionsDisplay.setMap(map);
                            var pinIcon = new google.maps.MarkerImage(tool_img, null, null, null, new google.maps.Size(42, 68)
                        );
                            var toolLatlng = new google.maps.LatLng(tool_lat, tool_lng); 
                            var marker = new google.maps.Marker({
                                map: map,
                                position: toolLatlng,
                                icon: pinIcon,
                                title:tool_fulladdress.toString()
                            });
                            var userLatlng = new google.maps.LatLng(user_lat, user_lng);
                            var marker = new google.maps.Marker({
                                map: map,
                                position: userLatlng,
                                icon: "http://cdn.webiconset.com/map-icons/images/pin6.png",
                                title:user_fulladdress.toString()
                            });
                            calcRoute(user_fulladdress, tool_fulladdress);
                    }                           
                }
                catch(err) {
                    console.log(err);
                }


            }
        return true;            
        }

    };
    function calcRoute(start,end) {
          var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.TravelMode.DRIVING
          };
          directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
            }
          });

    }
    function calculPrice() {
            var current_date = new Date();
            var date1 = $("#datepicker1").val();
            var time1 = $("#timepicker1").val();
            var date2 = $("#datepicker2").val();
            var time2 = $("#timepicker2").val();
            
            var time1 = time1.split(" ");
            var first_time = time1[0].split(":");
            var time2 = time2.split(" ");
            var second_time = time2[0].split(":");
            
            if (time1[1] == "PM") {
                var first_hr = parseInt(first_time[0]) +  12;
            }
            else {
                var first_hr = parseInt(first_time[0]);
            }
            if (time2[1] == "PM"){
                var second_hr = parseInt(second_time[0]) +  12;
            }
            else {
                var second_hr = parseInt(second_time[0]);
            }
            date1 = date1.split("/");
            date2 = date2.split("/");
            var firstDate = new Date((date1[2]+"-"+date1[0]+"-"+date1[1]+" "+ first_hr.toString() + ":" + first_time[1].toString() + ":00").replace(/-/g,"/"));
            var secondDate = new Date((date2[2]+"-"+date2[0]+"-"+date2[1]+ " " +second_hr + ":" + second_time[1] + ":00").replace(/-/g,"/"));
                
       //      if( current_date >= firstDate || firstDate >= secondDate) {
                
       //          $("#reserveModal").modal("hide");
       //          var message = "Please choose reasonable Dates for this tool.";
                // FlashMessages.sendError(message);
       //          return false;
                
       //      }

            var diff = (secondDate - firstDate);
            var diffDays = Math.round(diff / 86400000) + 1;
            var day_price = parseInt(Session.get("tool_price"))/7;  
            return Math.round(diffDays * day_price);
        }

