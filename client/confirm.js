// var rental_param = Session.get("rental_param");

Template.rentView.confirm = function( comp ) {
   return ( Session.get( 'currentPage' ) === comp );
};
Template.sendFeedback.rendered = function() {

	var checking = checkignFeedback();
	$('#star').raty({
		click: function ( score, evt){
			if (score){
				Session.set("marks", score);
			}
		},
		readOnly: function () {
			if (Session.get("complete"))
				return true;
			else 
				return false;
		},
		score: function () {
			if (Session.get("marks"))
				return Session.get("marks");
			else
				return 0;
		}
	});
};

Template.sendrentfeedback.rendered =  function () {
	var checking = checkignRentFeedback();
	$('#star').raty({
		click: function ( score, evt){
			if (score){
				Session.set("marks", score);
			}
		},
		readOnly: function () {
			if (Session.get("complete"))
				return true;
			else 
				return false;
		},
		score: function () {
			if (Session.get("marks"))
				return Session.get("marks");
			else
				return 0;
		}
	});	
};
Template.sendrentfeedback.events({
	'click .btn_accept': function () {
		if (Session.get("marks") == undefined){
			var message = "Please give the feedback.";
			FlashMessages.sendError(message);
		}
		else if (!$("#comment").val()) {
			var message = "Please give the comment.";
			FlashMessages.sendError(message);			
		}
		else {
			
			if (Session.get("given_feedback") == "1") {
				var sessions = [];
				sessions.push("given_feedback");
				sessions.push("marks");
				sessions.push("rental_param");
				deleteSession(sessions);
				Router.go("/");
			}			
			else {
				var toolid = Rental.find({_id: Session.get("rental_param")}).fetch()[0].toolId;
				var loanuserId = Rental.find({_id: Session.get("rental_param")}).fetch()[0].loanuserId;
				var text = $("#comment").val();
				Meteor.call("getServerTime", function (error, result) {
					var checkOtherFeedback = Feedback.find({rentalId:Session.get("rental_param")}).fetch()[0];

					if (!checkOtherFeedback) {
						Feedback.insert({toolid: toolid, rentalId: Session.get("rental_param"), loaner: {text:text, date: new Date(), userid: loanuserId, marks: Session.get("marks")}, display: "0"});
					}
					else {
						Feedback.update({_id: checkOtherFeedback._id}, {$set:{loaner: {text:text, date: new Date(), userid: loanuserId, marks: Session.get("marks")}, display: "1"}});
					}

					var message = "Thanks for your giving feedback for tool";
					FlashMessages.sendSuccess(message);
					$('#star').raty({score: Session.get("marks"), readOnly: true });		
					$("#comment").attr("readonly", true);
					Session.set("complete", "1");
				});
				return false;

			}
		}
	}
});


Template.sendFeedback.events({
	'click .btn_accept': function () {
		if (Session.get("marks") == undefined){
			var message = "Please give the feedback.";
			FlashMessages.sendError(message);
		}
		else if (!$("#comment").val()) {
			var message = "Please give the comment.";
			FlashMessages.sendError(message);			
		}
		else {
			if (Session.get("given_feedback") == "1") {
				var sessions = [];
				sessions.push("given_feedback");
				sessions.push("marks");
				sessions.push("rental_param");
				deleteSession(sessions);
				Router.go("/");
			}
			else {
				var toolid = Rental.find({_id: Session.get("rental_param")}).fetch()[0].toolId;
				var rentuserId = Rental.find({_id: Session.get("rental_param")}).fetch()[0].rentuserId;
				var text = $("#comment").val();
				Meteor.call("getServerTime", function (error, result) {
					var checkOtherFeedback = Feedback.find({rentalId:Session.get("rental_param")}).fetch()[0];

					if (!checkOtherFeedback) {
						Feedback.insert({toolid: toolid, rentalId: Session.get("rental_param"), renter: {text:text, date: new Date(), userid: rentuserId, marks: Session.get("marks")}, display: "0"});
					}
					else {
						Feedback.update({_id: checkOtherFeedback._id}, {$set:{renter: {text:text, date: new Date(), userid: rentuserId, marks: Session.get("marks")}, display: "1"}});
					}

					var message = "Thanks for your giving feedback for tool";
					FlashMessages.sendSuccess(message);
					$('#star').raty({score: Session.get("marks"), readOnly: true });		
					$("#comment").attr("readonly", true);
					Session.set("complete", "1");
				});
				return false;

			}

		}
	}
});
Template.returnConfirm.rendered = function() {
	Deps.autorun(function (c) {
		Meteor.subscribe("allRentalData");
		var rental = Rental.find( {_id:Session.get("rental_param")}).fetch();
		if (rental[0] != undefined) {
			var returnData = {};
			var userdata = Meteor.users.find({_id: rental[0].loanuserId}).fetch()[0];
			if (Meteor.user() != null) {
				if(Meteor.user().emails[0].address.trim() != userdata.emails[0].address.trim()) {
					$(".pickupConfirm").attr("class", "errormessage");
					$(".errormessage").html("<p>You have no any permission to see this page.</p>");
					$(".errormessage").show();
				}
				else {

					var pickupdate = rental[0].pickupDate;
					var enddate = rental[0].endDate;

					returnData["pickupdate"] = GetDateTime(pickupdate)["date"];
					returnData["pickuptime"] = GetDateTime(pickupdate)["time"];
					returnData["enddate"] = GetDateTime(enddate)["date"];
					returnData["endtime"] = GetDateTime(enddate)["time"];
					returnData["price"] = rental[0].price;
					Session.set("confirm_dates", returnData);
					c.stop();					
				}
			}
			else {				
			   // Session.set('trackForRouter','returnConfirm');
               Session.set('currentLoginPage', 'login');
               Router.go("/user/login");			   
			}				
		}
    });
};
Template.returnConfirm.renter = function() {
	Deps.autorun(function (c) {
		var rental = Rental.find( {_id:Session.get("rental_param")}).fetch();	
		if (rental[0]) {
			Session.set("confirm_username", Meteor.users.find({_id:rental[0].rentuserId}).fetch()[0].profile.fullname);
		}		
	});
	return Session.get("confirm_username");
};

Template.returnConfirm.pickupdate = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["pickupdate"] !== null) {
		return Session.get("confirm_dates")["pickupdate"];
	}
};
Template.returnConfirm.pickuptime = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["pickuptime"] !== null) {
		return Session.get("confirm_dates")["pickuptime"];
	}
};
Template.returnConfirm.enddate = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["enddate"] !== null) {
		return Session.get("confirm_dates")["enddate"];
	}
};
Template.returnConfirm.endtime = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["endtime"] !== null) {
		return Session.get("confirm_dates")["endtime"];
	}
};
Template.returnConfirm.price = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["price"] !== null) {
		return Session.get("confirm_dates")["price"];
	}	
};
Template.returnConfirm.tool = function() {
	Deps.autorun(function (c) {
		var rental = Rental.find( {_id:Session.get("rental_param")}, {fields:{toolId:1}}).fetch();	
		if (rental[0]) {
			Deps.autorun(function (c) {
				Meteor.subscribe("getTools");
				tool = Tools.find({_id:rental[0].toolId}).fetch()[0];
				if (tool)
					Session.set("tooldesc", tool.tooldesc);
			});
		}		
	});
	return Session.get("tooldesc");
};
Template.returnConfirm.thumbnail = function() {
	Deps.autorun(function (c) {
		var rental = Rental.find( {_id:Session.get("rental_param")}, {fields:{toolId:1}}).fetch();	
		if (rental[0]) {
			Deps.autorun(function (c) {
				Meteor.subscribe("getTools");
				tool = Tools.find({_id:rental[0].toolId}).fetch()[0];
				if (tool){
					Session.set("toolimg", tool.img);
				}
			});
		}
	});
	return Session.get("toolimg");
};
Template.returnConfirm.events({
	'click .btn_accept': function () {
		Meteor.call("returnConfirm", Session.get("rental_param"), function (error, result) {
			if (result == 2) {
				Meteor.call("transferToLoanUser", Session.get("rental_param"), function (transferError, transferResult) {
					if (transferResult) {
						var message = "This tool has been confirmed to returend by you. Thanks.";
						FlashMessages.sendSuccess(message, { autoHide: false });
						var toolId = Rental.find({_id:Session.get("rental_param")}).fetch()[0].toolId;
						var rentuser = Rental.find({_id:Session.get("rental_param")}).fetch()[0].rentuserId;
						var loanuserId = Rental.find({_id:Session.get("rental_param")}).fetch()[0].loanuserId;				
						Meteor.subscribe("getTools");
						var tools = Tools.find({_id:toolId}).fetch()[0].toolname;
					
						var rentuser = Meteor.users.find({_id: rentuser}).fetch()[0];
						var loanuser = Meteor.users.find({_id: loanuserId}).fetch()[0];
						var html = "";
						html += "<div style='width: 600px;'>";
							html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'><a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a></p>";
							html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
								html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>Please leave feedback for your rental "+tools+"</p>";
								html += "<div style='width: 500px;display: block;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;text-align:center;padding-top: 20px;'>";
									// html += "<a href='"+server_host+"sendfeedback?rental="+Session.get("rental_param")+"'>Please hit this link to give the feedback for the tool you have rentered.</a>";
									html += "<a href='"+server_host+"confirm/sendfeedback/"+Session.get("rental_param")+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Please hit this link to give the feedback for the tool you have rentered.</a>";
								html += "</div>";
							html += "</div>";
						html += "</div>";

		    	        Meteor.call('sendEmail',
		        	        rentuser.emails[0].address,
		            	    "dennis.e.merrill@gmail.com",
		                	'New Rental Confirmation from Eqwip.It',
		                	'', html);

						var html = "";
						html += "<div style='width: 600px;'>";
							html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'><a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a></p>";
							html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
								html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>Please leave feedback for your rental "+tools+"</p>";
								html += "<div style='width: 500px;display: block;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;text-align:center;padding-top: 20px;'>";
									// html += "<a href='"+server_host+"sendfeedback?rental="+Session.get("rental_param")+"'>Please hit this link to give the feedback for the tool you have rentered.</a>";
									html += "<a href='"+server_host+"confirm/sendrentfeedback/"+Session.get("rental_param")+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Please hit this link to give the feedback for the tool you have rentered.</a>";
								html += "</div>";
							html += "</div>";
						html += "</div>";

		    	        Meteor.call('sendEmail',
		        	        loanuser.emails[0].address,
		            	    "dennis.e.merrill@gmail.com",
		                	'New Rental Confirmation from Eqwip.It',
		                	'', html);
					}
				});
    	    }
    	    else if(result == 3) {
    	    	var mesage = "You have confirmed already to returnded for this tool.";
    	    	FlashMessages.sendError(mesage, { autoHide: false });
    	    }
		});
	}
});
Template.pickupConfirm.rendered = function() {
	Deps.autorun(function (c) {
		Meteor.subscribe("allRentalData");
		var rental = Rental.find( {_id:Session.get("rental_param")}).fetch();
		if (rental[0] != undefined) {
			var returnData = {};
			var userdata = Meteor.users.find({_id: rental[0].loanuserId}).fetch()[0];
			if (Meteor.user() != null) {
				if(Meteor.user().emails[0].address.trim() != userdata.emails[0].address.trim()) {
					$(".pickupConfirm").attr("class", "errormessage");
					$(".errormessage").html("<p>You have no any permission to see this page.</p>");
					$(".errormessage").show();
				}
				else {

					var pickupdate = rental[0].pickupDate;
					var enddate = rental[0].endDate;

					returnData["pickupdate"] = GetDateTime(pickupdate)["date"];
					returnData["pickuptime"] = GetDateTime(pickupdate)["time"];
					returnData["enddate"] = GetDateTime(enddate)["date"];
					returnData["endtime"] = GetDateTime(enddate)["time"];
					returnData["price"] = rental[0].price;
					Session.set("confirm_dates", returnData);
					c.stop();					
				}
			}
			else {
			   // Session.set('trackForRouter','returnConfirm');
               Session.set('currentLoginPage', 'login');
               Router.go("/user/login");			   
			}				
		}
    });
};
Template.pickupConfirm.pickupdate = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["pickupdate"] !== null) {
		return Session.get("confirm_dates")["pickupdate"];
	}
};
Template.pickupConfirm.pickuptime = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["pickuptime"] !== null) {
		return Session.get("confirm_dates")["pickuptime"];
	}
};
Template.pickupConfirm.enddate = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["enddate"] !== null) {
		return Session.get("confirm_dates")["enddate"];
	}
};
Template.pickupConfirm.endtime = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["endtime"] !== null) {
		return Session.get("confirm_dates")["endtime"];
	}
};
Template.pickupConfirm.price = function () {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["price"] !== null) {
		return Session.get("confirm_dates")["price"];
	}	
};
Template.pickupConfirm.tool = function() {
	Deps.autorun(function (c) {
		var rental = Rental.find( {_id:Session.get("rental_param")}, {fields:{toolId:1}}).fetch();	
		if (rental[0]) {
			Deps.autorun(function (c) {
				Meteor.subscribe("getTools");
				tool = Tools.find({_id:rental[0].toolId}).fetch()[0];
				if (tool)
					Session.set("tooldesc", tool.tooldesc);
			});
		}		
	});
	return Session.get("tooldesc");
};
Template.pickupConfirm.thumbnail = function() {
	Deps.autorun(function (c) {
		var rental = Rental.find( {_id:Session.get("rental_param")}, {fields:{toolId:1}}).fetch();	
		if (rental[0]) {
			Deps.autorun(function (c) {
				Meteor.subscribe("getTools");
				tool = Tools.find({_id:rental[0].toolId}).fetch()[0];
				if (tool){
					Session.set("toolimg", tool.img);
				}
			});
		}
	});
	return Session.get("toolimg");
};
Template.pickupConfirm.events({
	'click .btn_accept': function () {
		bootbox.confirm("Are you sure?", function(result) {
			if(result == true) {
				Meteor.call("pickupConfirm", Session.get('rental_param'), function (error, result) {
					if (result) {
						var message = "This tool has been confirmed to received by you. Thanks.";
						FlashMessages.sendSuccess(message, { autoHide: true });
						setTimeout("redirectTo('/')",3000);
					}
				});
			}
		});
	}
});
Template.loanConfirms.rendered = function() {
	$(".loanConfirm").hide();
    Deps.autorun(function (c) {
    	var returnData = {};
    	Meteor.subscribe("allRentalData");
		// alert(Session.get('rental_param'));
		var rental = Rental.find( {_id:Session.get('rental_param')}).fetch();
		if (rental[0] != undefined) {
				var userdata = Meteor.users.find({_id: rental[0].loanuserId}).fetch()[0];
				if (Meteor.user() != null) {
					if (Meteor.user().emails[0].address.trim() == userdata.emails[0].address.trim()) {

						var pickupdate = rental[0].pickupDate;
						var enddate = rental[0].endDate;

						returnData["pickupdate"] = GetDateTime(pickupdate)["date"];
						returnData["pickuptime"] = GetDateTime(pickupdate)["time"];
						returnData["enddate"] = GetDateTime(enddate)["date"];
						returnData["endtime"] = GetDateTime(enddate)["time"];

						Session.set("confirm_dates", returnData);

						$(".loanConfirm").show();
						if (rental[0].flag == "1") {
							Session.set("tool_confirmed", "1");
						}
						c.stop();

					}
					else {
						$(".loanConfirm").attr("class", "errormessage");
						$(".errormessage").html("<p>You have no any permission to see this page.</p>");
						$(".errormessage").show();
					}
				}
				else {				
				   Session.set('trackForRouter','/confirm/reserve/'+ Session.get('rental_param'));
	               Session.set('currentLoginPage', 'login');
	               Router.go('/user/login');		   
				}	
			// }
		}
		else {
			Session.set("confirm_dates", "");
		}
		
	});

};
Template.loanConfirms.pickupdate =  function() {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["pickupdate"] !== null) {
		return Session.get("confirm_dates")["pickupdate"];
	}
};
Template.loanConfirms.pickuptime =  function() {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["pickuptime"] !== null) {
		return Session.get("confirm_dates")["pickuptime"];
	}
};
Template.loanConfirms.enddate =  function() {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["enddate"] !== null) {
		return Session.get("confirm_dates")["enddate"];
	}
};
Template.loanConfirms.endtime =  function() {
	if (typeof Session.get("confirm_dates") === "object" && Session.get("confirm_dates")["endtime"] !== null) {
		return Session.get("confirm_dates")["endtime"];
	}
};
Template.loanConfirms.toolname = function() {
	// tooldesc
	Deps.autorun(function () {
    	Meteor.subscribe("getTools");
		var rental = Rental.find( {_id:Session.get("rental_param")}, {fields:{toolId:1}}).fetch()[0];
		if (rental) {
			var tool = Tools.find({_id:rental.toolId}).fetch()[0];
			Deps.autorun(function () {
				if (tool){
					Session.set("confirmi_toolname", tool.toolname);					
				}
			});
		}
		else {
			 Session.set("confirmi_toolname", " ");
		}
	});
	return Session.get("confirmi_toolname");
};

Template.loanConfirms.events({
    'click .btn_accept': function () {

		var rental_data = Rental.find({_id: Session.get("rental_param")}).fetch()[0];
		var rent_user = Meteor.users.find({_id: rental_data.rentuserId}).fetch()[0];
        var loan_user = Meteor.users.find({_id: rental_data.loanuserId}).fetch()[0];
        var rent_tool = Tools.find({_id: rental_data.toolId}).fetch()[0];
		var formatted_pickupDate = getForamattedDates(rental_data.pickupDate);
		var formatted_returnDate = getForamattedDates(rental_data.endDate);

        var html = "";
        if (Session.get("tool_confirmed") == "1") {
			var message = "This tool has been aleady confirmed.";
			FlashMessages.sendAlert(message, { autoHide: true });
			setTimeout(function(){
				Router.go("/");
			},1500);			
        }
		else{
                             
			Rental.update({_id: Session.get("rental_param")}, {$set: {flag: "1", comment:$("#comment").val()}});
            var description = "Paying from "+ rent_user.emails[0].address + " For " + rent_tool.toolname;
            /* Charging from rent user for tool */
            Meteor.call( 'chargingPayment', rent_user.profile.customerId, description, parseFloat(rental_data.price), function (error, result) {
            	if (result.id != undefined) {
	                html += "<div style='width: 600px;'>";
					html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'>";
						html += "<a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a>";
					html += "</p>";
					html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
						html += "<div style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;padding:10px 0px;'><p style='margin:0px;'><span style='width:100px;word-wrap:break-word;over-flow:ellipsis;'>"+loan_user.profile.fullname+"</span> has accepted your offer</p> <p style='margin:0px;'>to rent "+rent_tool.toolname+"</p></div>";
							html += "<div style='width: 500px;display: block;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
								html += "<div style='display: inline-block;margin-left: 40px;width: 30%;'>";
									html += "<p style='font-weight: bold;margin-bottom:0px;'>Pickup Date: </p>";
								html += "</div>";
								html += "<div style='display: inline-block; margin-left: 40px;vertical-align: top;width: 30%;'>";
								html += "<p style='text-overflow: ellipsis;width: 200px;margin-bottom:0px;'>"+formatted_pickupDate+"</p>";
								html += "</div>";
								html += "<div style='display: inline-block;margin-left: 40px;width: 30%;'>";
									html += "<p style='font-weight: bold;margin-bottom:0px;'>Return Date: </p>";
								html += "</div>";
								html += "<div style='display: inline-block; margin-left: 40px;vertical-align: top;width: 30%;'>";
									html += "<p style='text-overflow: ellipsis;width: 200px;margin-bottom:0px;'>"+formatted_returnDate+"</p>";
								html += "</div>";
								html += "<div style='display: inline-block;margin-left: 40px;width: 30%;'>";
									html += "<p style='font-weight: bold;margin-bottom:0px;'>Estimated Cost: </p>";
								html += "</div>";
								html += "<div style='display: inline-block; margin-left: 40px;vertical-align: top;width: 30%;'>";
									html += "<p style='text-overflow: ellipsis;width: 200px;margin-bottom:0px;'>$"+rental_data.price+"</p>";
								html += "</div>";
								html += "<div style='display: inline-block;margin-left: 40px;width: 30%;'>";
									html += "<p style='font-weight: bold;margin-bottom:0px;'>Location: </p>";
								html += "</div>";
								html += "<div style='display: inline-block; margin-left: 40px;vertical-align: top;width: 30%;'>";
									html += "<p style='text-overflow: ellipsis;width: 200px;margin-bottom:0px;'>"+rent_user.profile.fulladdress+"</p>";
								html += "</div>";
								if ($("#comment").val())
									html += "<div style='width: 420px;border:1px solid rgba(158, 158, 158, 0.8); height: 80px;margin-left: auto;margin-right: auto;margin-top:10px;'>"+$("#comment").val()+"</div>";
								html += "<div style='width: 400px;margin:20px auto;text-align: center;font-size: 30px;'><a href='"+server_host+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0)), to( rgb(0, 140, 0)));background-image: -webkit-linear-gradient( rgb(0, 220, 0), rgb(0, 140, 0));background-image:-moz-linear-gradient( rgb(0, 220, 0) , rgb(0, 140, 0));background-image:-ms-linear-gradient( rgb(0, 220, 0) , rgb(0, 140, 0));background-image: -o-linear-gradient( rgb(0, 220, 0) , rgb(0, 140, 0));background-image:linear-gradient( rgb(0, 220, 0) , rgb(0, 140, 0));'>Contact "+loan_user.profile.fullname+"</a></div>";
							html += "</div>";
						html += "</div>";
					html += "</div>";

		            Meteor.call('sendEmail',
		                rent_user.emails[0].address,
		                'dennis.e.merrill@gmail.com',
		                'New Rental Confirmation from Eqwip.It',
		                '', html);

					var message = "This tool has been confirmed to rent already. Thanks.";
					FlashMessages.sendSuccess(message, { autoHide: true });
					setTimeout(function(){
						Router.go("/");
					},1500);

            	}
            	else {
            		var message = "Payment part error!";
					FlashMessages.sendSuccess(message, { autoHide: true });
            	}

            });
		}
		return false;
	},
	'click .btn_decline': function () {
		bootbox.confirm("Are you sure?", function(result) {
			if (result == true) {
				var status = Rental.find({_id: Session.get("rental_param")},  {$fields:{flag:1}}).fetch()[0];
				if (status.flag == 0) {
					Meteor.call("declineApplicant", Session.get("rental_param"),function (error, result) {
						if (result == 1){
							Router.go("/loan/view");
						}
					});
				}
				else {
					var message = "You cannot decline now because this tool has been confirmed already Thanks.";
					FlashMessages.sendAlert(message, { autoHide: false });					
				}
			}
		}); 		
	},
	'click .errormessage': function () {
		Meteor.Router.to('/');
	}	
});
Template.loanConfirms.price =  function () {
	Meteor.subscribe("allRentalData");
	Deps.autorun(function () {
		if (Rental.find( {_id:Session.get("rental_param")}, {fields:{price:1}}).fetch()[0] != undefined){
			Session.set("confirm_price", Rental.find( {_id:Session.get("rental_param")}, {fields:{price:1}}).fetch()[0].price);
		}
		else{
			Session.set("confirm_price", "");
		} 
	});
	return Session.get("confirm_price");
	
}
Template.loanConfirms.loanuser =  function () {
   	   // var rental = GetRentalObj(rental_param);
		Deps.autorun(function () {
			var rental = Rental.find( {_id:Session.get("rental_param")}, {fields:{loanuserId:1}}).fetch();
			Deps.autorun(function () {
				if (rental[0] != undefined) {
					var user = Meteor.users.find( {_id:rental[0].loanuserId}).fetch();
					Session.set("confirm_loadnuser", user[0].profile.fullname);
				}
				else {
					Session.set("confirm_loadnuser");
				}
			});
		});
		return 	Session.get("confirm_loadnuser");
};

GetRentalObj = function (id) {
	    Deps.autorun(function () {
			return Rental.find( {_id:id}, {fields:{loanuserId:1}}).fetch();
		});
};

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
};

function getForamattedDates(date) {
	var dates = date.split(" ")[0];
	var time = date.split(" ")[1];
	var month = "";
	if (parseFloat(dates.split(",")[0]) < 10)
		month = "0"+parseFloat(dates.split(",")[0]);
	else
		month = dates.split(",")[0];
	return dates.split(",")[2]+"/"+month+"/"+dates.split(",")[1]+ " " + time.split(",")[0]+" "+ time.split(",")[1];
};

function checkignRentFeedback() {
	Session.set("given_feedback", "0");
	Deps.autorun(function (c) {
		Meteor.subscribe("allRentalData");
		var rental = Rental.find( {_id:Session.get("rental_param")}).fetch();
		if (rental[0] != undefined) {
			var userdata = Meteor.users.find({_id: rental[0].loanuserId}).fetch()[0];
			if (Meteor.user() != null) {
				if(Meteor.user().emails[0].address.trim() != userdata.emails[0].address.trim()) {
					$(".confirm_area").attr("class", "errormessage");
					$(".errormessage").html("<p>You have no any permission to see this page.</p>");
					$(".errormessage").show();
					return false;
				}
				else {
					var toolid = Rental.find({_id: Session.get("rental_param")}).fetch()[0].toolId;
					var rent_user = Rental.find({_id: Session.get("rental_param")}).fetch()[0].loanuserId;
				
					Meteor.subscribe("getAllFeedback");

					var feedback = Feedback.find({rentalId:Session.get("rental_param")}, {$orderby: {date: 1}}).fetch()[0];

					if (feedback) {
						if (feedback.loaner.marks) {
							$('#star').raty({score: feedback.loaner.marks, readOnly: true });
							$("#comment").val(feedback.loaner.text);
							$("#comment").attr("readonly", true);
							Session.set("marks", feedback.loaner.marks);
							Session.set("given_feedback", "1");							
						}
					}				
				}
			}
			else {
			   // Session.set('trackForRouter','returnConfirm');
               Session.set('currentLoginPage', 'login');
               Meteor.Router.to('/newuser');			   
			}				
		}
    });

};

function checkignFeedback() {
	Session.set("given_feedback", "0");
	Deps.autorun(function (c) {
		Meteor.subscribe("allRentalData");
		var rental = Rental.find( {_id:Session.get("rental_param")}).fetch();
		if (rental[0] != undefined) {
			var userdata = Meteor.users.find({_id: rental[0].rentuserId}).fetch()[0];
			if (Meteor.user() != null) {
				if(Meteor.user().emails[0].address.trim() != userdata.emails[0].address.trim()) {
					$(".confirm_area").attr("class", "errormessage");
					$(".errormessage").html("<p>You have no any permission to see this page.</p>");
					$(".errormessage").show();
					return false;
				}
				// var toolid = Rental.find({_id: Session.get("rental_param")}).fetch()[0].toolId;
				// var rent_user = Rental.find({_id: Session.get("rental_param")}).fetch()[0].rentuserId;
			
				Meteor.subscribe("getAllFeedback");

				var feedback = Feedback.find({rentalId:Session.get("rental_param")}, {$orderby: {date: 1}}).fetch()[0];

				if (feedback) {
					if (feedback.renter.marks) {
						$('#star').raty({score: feedback.renter.marks, readOnly: true });
						$("#comment").val(feedback.renter.text);
						$("#comment").attr("readonly", true);
						Session.set("marks", feedback.renter.marks);
						Session.set("given_feedback", "1");
					}
				}

			}
			else {
			   // Session.set('trackForRouter','returnConfirm');
               Session.set('currentLoginPage', 'login');
               Meteor.Router.to('/newuser');			   
			}				
		}
    });
}