Template.active.getActiveRentals = function () {
	return Rental.find({ $and: [{rentuserId : Meteor.userId()}, {flag: 1}] });
};
Template.active.getToolThumbnail = function (toolid) {
	return getToolThumbnail(toolid);
};
Template.active.getToolName = function (toolid) {
	return getToolName(toolid);
};
Template.active.getToolCat = function (toolid) {
	var catId = getToolCatId(toolid);
	if (catId){
		var cat = getToolCat(catId);
		if (cat)
			return cat
		else
			return "";
	}
	else {
		return "";
	}
};
Template.active.getToolLoanUser = function (userid) {
	return getUserFullName(userid);
};
Template.active.getFormatedDates = function (date) {
	return getFormatedDates(date);
};
Template.active.events({
	"click .rentrow": function () {
		Router.go("/rental/details/"+this._id);
	}
});

Template.rentalDetail.serveCurrentIs = function (comp) {
	console.log(Session.get("rentalType"));
	if (Session.get("rentalType") == "active") {
		Session.set("currentPage", "rentalActive");
	}
	else if (Session.get("rentalType") == "reserved") {
		Session.set("currentPage", "rentalReserved");
	}
	return ( Session.get( 'currentPage' ) === comp );
};
Template.rentalActive.getRentalDetail = function () {
	var obj = new Object();
	var rental = Rental.find({_id: Session.get("myRentalId")}).fetch()[0];
	obj.thumbnail = getToolThumbnail(rental.toolId);
	obj.img = getToolImg(rental.toolId);
	obj.toolname = getToolName(rental.toolId);
	obj.tooldesc = getToolDesc(rental.toolId);
	obj.pickupDate = getFormatedDates(rental.pickupDate);
	obj.endDate = getFormatedDates(rental.endDate);
	obj.loanuser = getUserFullName(rental.loanuserId);
	obj.price = rental.price;
	return obj;
	// console.log(toolId);
	// console.log(Session.get("myRentalId"));
	// obj.thumbnail = 
};
Template.rentalActive.events({
	'click #changeDuartion': function () {
		$("#changeDurationModal").modal();
	},
	'click #changeConfirm': function () {
		var loanUser = Rental.find({_id: Session.get("myRentalId")}).fetch()[0].loanuserId;
		var date = $("#datepicker2").val();
		date = getSplitedDatesFromFormat(date);

		var obj = {
			requestFrom: Meteor.userId(),
			receipt: loanUser,
			rentalId: Session.get("myRentalId"),
			status: "0",
			type: "CD", //cd: change duration
			endDate: date+" "+$("#timepicker2").val(),
			created: new Date()
		};
		Request.insert(obj);
		var message = "Your request has been sent to loan User.";
		FlashMessages.sendSuccess(message);

		$("#changeDurationModal").modal("hide");	
	},
	'click #sendMessage': function () {
		$("#messageModal").modal();
	},
	'click #messageSubmit': function () {
		$("#messageForm").submit();
		// var title = $("#title").val();
		// var text = $("#content").val();
		// console.log($("#uploadFile").srcElement.files);
	},
	'submit': function (e, tmpl) {
		e.preventDefault();

		var subject = $("#title").val();
		var text = $("#content").val();
		var loanUser = Rental.find({_id: Session.get("myRentalId")}).fetch()[0].loanuserId;
		var loanUserMailAddr = Meteor.users.find({_id: loanUser}).fetch()[0].emails[0].address;

		Meteor.call("sendEmail", loanUserMailAddr, Meteor.user().emails[0].address, subject, text, "");
	}

});
Template.rentalActive.rendered = function () {
	var rental = Rental.find({_id: Session.get("myRentalId")}).fetch()[0];
	var pickupDateTime = getFormatedDates(rental.pickupDate);
	pickupDateTime = pickupDateTime.split(" ");
	var pickupDate = pickupDateTime[0];
	var pickupTime = pickupDateTime[1];

	var endDateTime = getFormatedDates(rental.endDate);
	// console.log(getHour(endDateTime));
	var sEndDates = getSplitedDates(endDateTime);
	sEndDates = new Date(sEndDates["year"], sEndDates["month"]-1, sEndDates["date"], sEndDates["hour"], sEndDates["min"], 0, 0 );
	var today = new Date();

	// var diff =  sEndDates - today;
	var diff =  today - sEndDates;
	diff = new Date(diff);	
	endDateTime = endDateTime.split(" ");
	var endDate = endDateTime[0];
	var endTime = endDateTime[1];

	$("#datepicker1").val(pickupDate);
	$("#timepicker1").val(pickupTime+" "+pickupDateTime[2]);
    // $('#datepicker2').datepicker("update", endDate);
    $('#datepicker2').val(endDate);
    $('#datepicker2').datepicker({
                startDate: "+"+diff.getDate()+"d"
            });
    $('#timepicker2').timepicker('setTime', endTime+" "+endDateTime[2]); 
};
Template.reserved.getActiveRentals = function () {
	return Rental.find({ $and: [{rentuserId : Meteor.userId()}, {flag: 0}] });
};
Template.reserved.getToolThumbnail = function (toolid) {
	return getToolThumbnail(toolid);
};
Template.reserved.getToolName = function (toolid) {
	return getToolName(toolid);
};
Template.reserved.getToolCat = function (toolid) {
	var catId = getToolCatId(toolid);
	if (catId){
		var cat = getToolCat(catId);
		if (cat)
			return cat
		else
			return "";
	}
	else {
		return "";
	}
};
Template.reserved.getToolLoanUser = function (userid) {
	return getUserFullName(userid);
};
Template.reserved.getFormatedDates = function (date) {
	return getFormatedDates(date);
};
Template.reserved.events({
	"click .rentrow": function () {
		Router.go("/rental/details/"+this._id);
	}
});

Template.rentalReserved.getRentalDetail = function () {
	var obj = new Object();
	var rental = Rental.find({_id: Session.get("myRentalId")}).fetch()[0];
	obj.thumbnail = getToolThumbnail(rental.toolId);
	obj.img = getToolImg(rental.toolId);
	obj.toolname = getToolName(rental.toolId);
	obj.tooldesc = getToolDesc(rental.toolId);
	obj.pickupDate = getFormatedDates(rental.pickupDate);
	obj.endDate = getFormatedDates(rental.endDate);
	obj.loanuser = getUserFullName(rental.loanuserId);
	obj.price = rental.price;
	return obj;
	// console.log(toolId);
	// console.log(Session.get("myRentalId"));
	// obj.thumbnail = 
};
