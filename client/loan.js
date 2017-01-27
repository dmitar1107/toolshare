    // Mongo fields
// tooldesc - description of the tool
// fname - first name of the user
// lname - last name of the user
//

var loanWorkflow = [
    // Note: a router filter makes sure user is signed in before entering this workflow
    'loanStepOne',
    'loanStepTwo',
    'loanStepThree',
    'loanStepFour',
    'loanDashboard',
    'home'
];

var id = 0;
var currentWorkflow = 0;
var bExpand=false;

Template.loanView.rendered = function ( ) {
    if (Session.get('currentPage') == undefined) 
        Session.set('currentPage', "");
}
Template.loanView.serveCurrentIs = function( comp ) {
    console.log("** serveCurrentIs ***" + Session.get('currentPage'));
    return ( Session.get( 'currentPage' ) === comp );
};


Template.loanViewSignIn.events({
    'click input.new_customer_btn': function () {
        console.log("new user button" );
        Session.set( 'currentPage', 'createnewtemplate' );
    },

    'click input.existing_customer_btn': function () {
        console.log("existing user button" );
        Session.set( 'currentPage', 'newuser' );
        Session.set( 'nextPage', loanWorkflow[ currentWorkflow + 1 ] );
    }
});


// Step 2 - Tool Information
Template.loanViewStepTwo.events({
    'submit' : function(e) {
        Session.set( 'currentUser_ToolName', document.getElementById("loanToolName").value );
        Session.set( 'currentUser_ToolDescription', document.getElementById("loanStepOneDescription").value );      
        Session.set( 'currentUser_ToolAge', document.getElementById("loanToolAge").value );
        Session.set( 'currentUser_ToolCategory', document.getElementById("loanToolCategory").value );
        nextWorkflowStep();
        e.preventDefault();
    }
});

// Step 3 - Pricing
Template.loanViewStepThree.events({
    'submit' : function(e) {
        Session.set( 'currentUser_NotifyEmail', document.getElementById("loanEmailNotify").checked );
        Session.set( 'currentUser_NotifySms', document.getElementById("loanSmsNotify").checked );
        nextWorkflowStep();
        e.preventDefault();
    },
});
// Step 4 - Approval and Legal Info, loanStepFour
Template.loanViewStepFour.events({
   'submit' : function (ev) {
        ev.preventDefault();
        var userData = Meteor.user();
        var toolData = {
            fulladdress: userData.profile.fulladdress,
            toolname: Session.get('currentUser_ToolName'),
            tooldesc: Session.get('currentUser_ToolDescription'),
            toolcat: Session.get('currentUser_ToolCategory'),
            notifyemail: Session.get('currentUser_NotifyEmail'),
            notifysms: Session.get('currentUser_NotifySms'),
            lat: userData.profile.address_lat,
            lng: userData.profile.address_lng,
            userid: Meteor.userId(),
            img: Session.get("currentUser_img"),
            thumbnail: Session.get("currentUser_thumbnail"),
            price: parseFloat(Session.get('currentUser_Price')),
            toolcat: Session.get('currentUser_ToolCategory'),
            active: false,
            a_active: false
        };

        Meteor.call("createNewTool", toolData, function (error, result) {
            if (result) {
                nextWorkflowStep();    
            }
        })        
        
    },
   'change input': function(ev, template) {

        ev.preventDefault();
        var file = document.getElementById('loanUpload_btn').files[0];
        
        if (file != undefined ) {
            fileType = file.type;
            reader = new FileReader();
            reader.onload = function(e) {
                var image = new Image();
                    image.src = reader.result;

                image.onload = function() {
                    var maxWidth = 100,
                        maxHeight = 100,
                        imageWidth = image.width,
                        imageHeight = image.height;

                    if (imageWidth > imageHeight) {
                        if (imageWidth > maxWidth) {
                          imageHeight *= maxWidth / imageWidth;
                          imageWidth = maxWidth;
                        }
                    }
                    else {
                        if (imageHeight > maxHeight) {
                          imageWidth *= maxHeight / imageHeight;
                          imageHeight = maxHeight;
                        }
                    }

                    var canvas = document.createElement('canvas');
                    canvas.width = imageWidth;
                    canvas.height = imageHeight;

                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0, imageWidth, imageHeight);
                    var finalFile = canvas.toDataURL(fileType);

                    Session.set("currentUser_img", e.target.result);
                    Session.set("currentUser_thumbnail", finalFile);
                    
                    // Quick test to verify upload: Update an image on the page with the data
                    $(template.find('img')).attr('src', finalFile);
                }           
            
            }
            reader.readAsDataURL(file);
        }

    }
});

Template.loanViewStepFour.rendered = function () {
    $('#current_price').slider()
        .on('slide', function(ev){
            $(".myPrice").html("$"+ev.value);
            Session.set('currentUser_Price', ev.value );
        });
};

Template.loanViewStepFour.calcLoanLowRange = function() {
    var prices = Prices.find({cat: Session.get('currentUser_ToolCategory')});
    var min = 0;
    if (prices.count() > 0) {
        var cost = new Array;
        prices.forEach( function (result) {
            cost.push(parseFloat(result.price));
        });
        if (prices.count() != 1)
            min = cost.min();
    }
    return min;
};

Template.loanViewStepFour.calcLoanHighRange = function() {
    var prices = Prices.find({cat: Session.get('currentUser_ToolCategory')});
    var max = 0;
    if (prices.count() > 0) {
        var cost = new Array;
        prices.forEach( function (result) {
            cost.push(parseFloat(result.price));
        });
        max = cost.max();
    }
    return max;

};

Template.loanViewStepFour.calcLoanSuggestion = function() {
    var prices = Prices.find({cat: Session.get('currentUser_ToolCategory')});
    var average = 0;
    if (prices.count() > 0) {
        var cost = new Array;
        prices.forEach( function (result) {
            cost.push(parseFloat(result.price));
        });
        if (prices.count() != 1) 
            average = eval(cost.join('+')) / prices.count();
        else 
            average = eval(cost.join('+')) / 2;
    }
    return average;
};

Template.loanViewStepTwo.toolcats = function () {
    Meteor.subscribe("getToolCats");
    return ToolCats.find( {}, { sort: {categories:1} });
};
Template.loanViewDashboard.toolcats = function (id) {
    var cat = "";
    Deps.autorun(function () {
        var toolcat = ToolCats.find({_id: id}).fetch();
        if (toolcat[0]) {
            Session.set("toolcat"+id, toolcat[0].categories);
        }
    });
    return Session.get("toolcat"+id);
};
Template.loanViewDashboard.rendered =  function () {

    if (Meteor.user() === null) {
        Session.set( 'currentLoginPage', 'login');     // TODO: only if not logged in      
        Router.go('/user/login');
    }
    else {
        try{
            if (Meteor.user() != null ) {
                if (Meteor.user().profile.recipientId == undefined) {
                    Session.set( 'currentPage', 'addBank');
                    Router.go('/loan/view'); 
                }
                Deps.autorun( function () {
                    Meteor.subscribe("getAllFeedback");
                    var feedback = Feedback.find({$or: [ {"renter.userid": Meteor.userId()}, {"loaner.userid": Meteor.userId()}]}).fetch();
                    if (feedback) {
                        feedback.forEach( function (result) {
                            if (result.renter.userid == Meteor.userId()) {
                                $("#star_"+result._id).raty({score: result.renter.marks, readOnly: true });
                            }
                            else if(result.loaner.userid == Meteor.userId()){
                                $("#star_"+result._id).raty({score: result.loaner.marks, readOnly: true });
                            }
                            
                        });        

                    }
                });  

            }
        }
        catch(err){
            console.log(err);
        }
        
    }

    $('.editable:not(.editable-click)').editable('destroy').editable({
      success: function(response, newValue) {
          var query = {};
          query[this.id.split("_")[0]] = newValue.replace(/\$|,/g, '');
          Tools.update({_id:this.id.split("_")[1]}, {$set:query});
    }});
    $('.toolcat').editable({                                                                                            
        value: 2,                                                                                                      
        source: Session.get("toolcategories"),
        success: function(response, newValue) {
          var query = {};
          query[this.id.split("_")[0]] = newValue;
          Tools.update({_id:this.id.split("_")[1]}, {$set:query});
        }
    }); 
}
Template.loanViewDashboard.events({
    'click #add_btn': function () {
        console.log("add clicked!");
        startAddWorkflow();
    },

    'click .edit_btn': function () {
        console.log("edit clicked!" + this._id);
    },

    'click .deactive_btn': function () {
        Tools.update({_id: this._id}, {$set:{active: false}});
        // Tools.remove( this._id );                    // TOD): Should not remove from DB, just mark as inactive
    },
    'click .active_btn': function () {
        Tools.update({_id: this._id}, {$set:{active: true}});
    },
    'click .remove_btn': function () {
        Tools.remove( this._id );   
    },  
    'click #account_btn': function() {
        console.log("edit user info clicked!" );
        Session.set( 'expandUser', !Session.get( 'expandUser' ) );
    }
});

Template.loanViewDashboard.expandAccount = function() {
    return Session.get( 'expandUser' );
}

Template.loanViewDashboard.usersTools = function() {

    // return any tools that belong to this user
    console.log("*** Dashboard List ***");

    if (Meteor.user() != null) {
        Meteor.subscribe("getTools");
        return Tools.find( {userid: Meteor.userId()}, { sort: {_id: -1} } );
    }

};

startAddWorkflow = function() {
    currentWorkflow = 1;            // Skip step one now since user info is already captured
    Session.set( 'currentStep', 1);
    Session.set( 'currentPage', loanWorkflow[ currentWorkflow ] );
};

nextWorkflowStep = function() {
    currentWorkflow++;
    Session.set( 'currentPage', loanWorkflow[ currentWorkflow ]);
    if (loanWorkflow[ currentWorkflow ] == "loanDashboard") {
        var sessions = [];
        sessions.push("currentUser_ToolName");
        sessions.push("currentUser_ToolDescription");
        sessions.push("currentUser_ToolCategory");
        sessions.push("currentUser_NotifyEmail");
        sessions.push("currentUser_NotifySms");
        sessions.push("currentUser_img");
        sessions.push("currentUser_thumbnail");
        sessions.push("currentUser_Price");
        sessions.push("currentUser_ToolCategory");
        deleteSession(sessions);
    }
    Session.set( 'currentStep', Session.get( 'currentStep' ) + 1 );
    console.log("*** Loan Workflow = " + currentWorkflow );
};

Template.loanViewDashboard.usersFeedback = function() {
    if (Meteor.user() != null) {
        Deps.autorun( function () {
            var data = [];
            Meteor.subscribe("getAllFeedback");
            var feedback = Feedback.find({$or: [ {"renter.userid": Meteor.userId()}, {"loaner.userid": Meteor.userId()}]});

            if (feedback.count() > 0) {
                feedback.forEach( function (result) {
                    var obj = new Object();
                    obj._id = result._id
                    if (result.renter.userid == Meteor.userId()) {
                        obj.givefeedbackuser = result.loaner.userid;
                        obj.text = result.loaner.text;
                        obj.date = result.loaner.date;
                    }
                    else if(result.loaner.userid == Meteor.userId()) {
                        obj.givefeedbackuser = result.renter.userid;
                        obj.text = result.renter.text;
                        obj.date = result.renter.date;                        
                    }
                    data.push(obj);
                });
                Session.set("feedback_data", data);
            }
        });
    }
    return Session.get("feedback_data");
};
Template.loanViewDashboard.givenUser = function(userid) {
    return Meteor.users.find( {_id: userid} ).fetch()[0].profile.fullname;
};
Template.loanViewDashboard.givenDate = function(date) {
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var date = date.getDate();
    return month+"/"+date+"/"+year;
};
Template.loanViewDashboard.getStar = function (marks) {
    var on = Math.floor(marks);
    var half = marks - on;
    var star_rating = "";
    for(var i = 0; i < on; i ++) {
        star_rating += '<img class=one_image style="vertical-align: bottom" src='+server_host+'star-on.png />';
    }
    if (half > 0) {
        star_rating += '<img class=half_image style="vertical-align: bottom" src='+server_host+'star-half.png />';
    }
    console.log(star_rating);
};


Template.loanViewDashboard.getRenter = function() {
    return Feedback.find( {_id:this._id}, {fields:{date:1}});
};

Template.loanViewDashboard.users = function () {

//    return ToolCats.find( {}, { sort: {_id: 1} });
    console.log("*** user info ***" + Meteor.users.find( {_id: Meteor.userId()} ) );
    return Meteor.users.find( {_id: Meteor.userId()} );
};


Template.loanViewaddBank.events({
    'submit' : function( e ) {
        e.preventDefault();
        submitme();
        return false;
    },
    'click .addbankback' : function () {
        Router.go("/");
    }   
});

function submitme() {
    Meteor.call( 'createBankaccount', bankname.value, routingnumber.value, accountnumber.value, function (error, result) {
        if ( result ){
            Session.set( 'currentPage', 'loanDashboard');
            Router.go("/loan/view");
        }
        else 
        {
            bootbox.alert("Error!");
        }
    });
}