Template.edituser.users = function () {
    return Meteor.users.find( {_id: Meteor.userId()} );
};

Template.edituser.getEmail = function () {
    var user = Meteor.user();
    if (user && user.emails)
        return user.emails[0].address;
};

Template.edituser.events({
    'submit': function (e) {
        // submitme();
        e.preventDefault();
        return false;
    },
    'click #profileupdate': function(e) {
        var profile = {};
        var data = $("#createform").serializeArray();
        $.each(data, function (i, result) {
            profile[result.name] = result.value;
        });
        var options = {
            emails: [{
                address: $("#email_data").val(),
                verified: false
            }],
            profile: profile
        };
        Meteor.call( "setUserProfile", options, function(error, result) {
            if (result) {
                var message = "Success!";
                FlashMessages.sendSuccess(message);
            }
        });
    },
    'click #updateCredit' : function (e) {
        var cardNum = $("#credit_num").val();
        var expireDate = $("#expireDate").val();
        var expire_year = expireDate.split("/")[1];
        var expire_month = expireDate.split("/")[0];
        var credit_ccv = $("#credit_ccv").val();
        var payment = new PaymentProcess();
        progress.showPleaseWait();
        payment.setupStripeKey(Meteor.user().profile.fullname, cardNum, credit_ccv, expire_month, expire_year);
    },
    'click #updateBank' : function (e) {
        if ($("#bankName").val() != "" && $("#routingNumber").val() != "" && $("#accountNumber").val() != "") {
            progress.showPleaseWait();
            Meteor.call( 'createBankaccount', $("#bankName").val(), $("#routingNumber").val(), $("#accountNumber").val(), function (error, result) {
                progress.hidePleaseWait();                    
                if (result == true) {
                    var message = "Success!";
                    FlashMessages.sendSuccess(message);
                }
                else {
                    var message = "Error!";
                    FlashMessages.sendAlert(message);                    
                }
            });
        }
    }

});

Template.edituser.birthdate = function () {
	return Meteor.user().profile.birthday;
};
Template.edituser.rendered = function() {
    if (Meteor.user()) {
        $("#select_salutation").val(Meteor.user().profile.select_salutation).trigger("change");
        $("#gender").val(Meteor.user().profile.gender).trigger("change");
        $("#smartphone").val(Meteor.user().profile.smartphone).trigger("change");
        $("#smartphone").val(Meteor.user().profile.smartphone).trigger("change");
        $("#select_language").val(Meteor.user().profile.select_language).trigger("change");
        $('#birthday').datepicker();
        $('#ccDate').datepicker();
        $('#birthday').children('input').val(Meteor.user().profile.birthday)        
    }
    try {
        if(google) {
            autocomplete_init();
        }
    }
    catch(err) {
        console.log(err);
    }

};
