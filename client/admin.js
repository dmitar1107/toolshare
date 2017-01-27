Template.adminView.rendered = function () {
    $(document).ready(function(){
        $.bootstrapSortable(true);
        if (Session.get("adminTab")) {
            activaTab(Session.get("adminTab"));
        }

        $(".active_btn").on("click", function () {
            var id = $(this).attr("data-id");
            Tools.update({_id: id}, {$set: {a_active: true}});
            Session.set("adminTab", "adminTools");
        });
        $(".deactive_btn").on("click", function () {
            var id = $(this).attr("data-id");
            Tools.update({_id: id}, {$set: {a_active: false}});
            Session.set("adminTab", "adminTools");

        });
        $(".remove_btn").on("click", function () {
            var id = $(this).attr("data-id");
            Tools.remove({_id: id});
            Session.set("adminTab", "adminTools");
        });
    }); 
};   
Template.adminView.events({
    'submit' : function (e) {
        var vals = {
            cat: sel_cat.value,
            descr: edit_descr.value,
            company: edit_company.value,
            price: edit_price.value
        };
        Prices.insert( vals );
        e.preventDefault();
    },
    'click #adminAddCat_btn': function () {
        var cat = document.getElementById("adminAddCat_txt").value;
        ToolCats.insert( {categories: cat });
    },
    'click .remove_cat':function () {
         ToolCats.remove( {_id: this._id} );
         Session.set("adminTab", "adminToolCategories");
    },
    'click .edit_cat': function () {
         document.getElementById("categoryname").value = this.categories;
         document.getElementById("category_id").value = this._id;
    },
    'click .save_change': function() {  
         ToolCats.update(document.getElementById("category_id").value, {$set: {categories: document.getElementById("categoryname").value}});
         $("#editmodal").modal("hide");
    },
    'click .cc_test': function() {
        console.log("Stripe Init");
        Stripe.setPublishableKey(StripeKey);
        Stripe.createToken({
                number: '4242424242424242',
                cvc: '123',
                exp_month: 12,
                exp_year: 2013
            }, stripeResponseHandler);
        Session.set( "stripeError", "Processing..." );
    },
    'click .cc_customer': function() {
        Meteor.call( 'createCustomer', Session.get("token_value"), function (error, result) { console.log("bad stripe"); } );
    },
    'click .btn_DeletePrice': function() {
      console.log("remove price");
      Meteor.subscribe("setPrices");
      Prices.remove( this._id );

    },
    'click #getserverTime' : function () {
        Meteor.call("getServerTime", function (error, result) {
            if(result){
                $(".serverTime").html(result.toString());
            } 
        });
    },
    'click #getRental' : function () {
        console.log(Rental.find().fetch()[0]);
        var data = Rental.find();
        data.forEach( function (result) {
            var htt = "<p>"+JSON.stringify(result, true, 2)+"<p>";
            $(".rental").append(htt);
        });
        
    },
    'click #getPickupConfirm' : function () {
        var rentalID = $("#rentalID").val();
        Meteor.call("getPickupInfo", rentalID, function (error, result) {
            console.log(result);
        });
    },
    'click #getPickupReminder': function (error, result) {
        Meteor.call("getPickupReminderInfo", function (error, result) {
            console.log(result);
        });
    },
    'click #getTime': function(error, result){
        var time = moment();
        alert(moment.parseZone("2013-01-01T00:00:00-13:00").zone());
        // $(".timeval").html(time);
    },
    'click #getServerTime' : function (error, result) {
        Meteor.call("getServerMoment", function (error, result) {
            if (result) {
                alert(result);
            }
        });
    },
    'click #strieinput' : function () {
        var value = $("#striepkey").val();
        Meteor.call("setStipekey", "stripekey", value, function (error, result) {
            if (result) {
                var message = "Thanks for your updating Stripe Key!";
                FlashMessages.sendSuccess(message, { hideDelay: 1500 });
            }
        });
    },
    'click #paymentSubmit': function (e) {
        var param = new Object;
        param.secretKey = $("#secretkey").val();
        param.publishableKey = $("#publishablekey").val();
        param.insuranceFee = $("#insurancefee").val();
        param.transactionFee = $("#transactionfee").val();
        Meteor.call("setPaymentSetting", param, function (error, result) {
            if (result) {
                var message = "Thanks for your updating Stripe Key!";
                FlashMessages.sendSuccess(message, { hideDelay: 1500 });
            }
        });
        e.preventDefault();
        return false;
    }
                             
});

Template.adminView.toolcats = function () {
    Meteor.subscribe("getToolCats");
    return ToolCats.find();
};

Template.adminView.prices = function () {
    Meteor.subscribe("getPrices");
    return Prices.find();
};
Template.adminView.secretKey =  function () {
    Deps.autorun( function () {
        Meteor.subscribe("getSettings");
        var setting = Setting.find({key: "secretKey"}).fetch()[0];
        if (setting) {
            Session.set("secretKey", setting.value);
        }
    });
    if (Session.get("secretKey")) {
        return Session.get("secretKey");
    }
};

Template.adminView.publishableKey =  function () {
    Deps.autorun( function () {
        var setting = Setting.find({key: "publishableKey"}).fetch()[0];
        if (setting) {
            Session.set("publishableKey", setting.value);
        }
    });
    if (Session.get("publishableKey")) {
        return Session.get("publishableKey");
    }
};

Template.adminView.insuranceFee =  function () {
    Deps.autorun( function () {
        var setting = Setting.find({key: "insuranceFee"}).fetch()[0];
        if (setting) {
            Session.set("insuranceFee", setting.value);
        }
    });
    if (Session.get("insuranceFee")) {
        return Session.get("insuranceFee");
    }
};

Template.adminView.transactionFee =  function () {
    Deps.autorun( function () {
        var setting = Setting.find({key: "transactionFee"}).fetch()[0];
        if (setting) {
            Session.set("transactionFee", setting.value);
        }
    });
    if (Session.get("transactionFee")) {
        return Session.get("transactionFee");
    }
};

Template.adminView.getPriceCat = function( id ) {
    console.log("getPricesCat = " + id );
    Meteor.subscribe("getToolCats");
    var test = ToolCats.findOne( {_id:id} );
    var ret = "undefined";
    if ( test )
        ret = test.categories;
    return ret;
};
Template.adminView.users = function () {
    Meteor.subscribe("allUserData");
    var return_val = new Array;
    Meteor.users.find().forEach( function (post) {
         return_val.push({username:post.username, emails: post.emails.address});
    });
    return return_val;
};

function stripeResponseHandler(status, response) {
    if (response.error) {
        Session.set( "stripeError", "Error" );
    } else {
        console.log( "stripe token id = " + response.id );
        Session.set("token_value", response.id);
        Session.set( "stripeError", "Key OK" );
//        Meteor.call( 'processStripePayment', response.id, function (error, result) { console.log("bad stripe"); } );
    }
};

Template.adminView.stripeError = function () {
    return Session.get("stripeError");
};
Template.adminView.toolData =  function () {
    console.log(Tools.find({}).fetch());
    return Tools.find({}).fetch();
}

Template.adminView.getCategoryName =  function (id) {
    // console.log(ToolCats.find({_id: id}).fetch()[0].categories);
    try {
        return ToolCats.find({_id: id}).fetch()[0].categories;   
    }
    catch (err) {
        return "Removed";
    }
}
Template.adminView.getFormattedDate = function (date) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    return year+"/"+month+"/"+day+" "+hour+":"+min;
}