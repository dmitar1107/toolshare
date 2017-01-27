Template.header.events({
    'click #sign_title': function () {
        Router.go('/user/login'); 
        // Session.set( 'currentLoginPage', 'login');     // TODO: only if not logged in
        // Meteor.Router.to( '/newuser' );
    },
    'click #signout_title': function () {
		Meteor.logout(function(err) {
			Router.go('/user/login');
		});
     },  
     'click #menu_rents': function () {
        Router.go('/rental/rented'); 
     },
     'click #myaccount' : function () {
        Router.go('/myaccount/edituser'); 
     },
     'click #myrentals' : function () {
        Router.go('/rental/rented'); 
     }
});
function logout() {
    Session.set( 'currentPage', 'newuser');                       
}

var signinTitle = "<span id='sign_title'>Sign In</span>";
var signoutTitle = "<span id='signout_title'>Sign Out</span>";

Template.header.customsignIn = function() {
    return new Handlebars.SafeString(signinTitle); 
};
Template.header.customsignOut = function() {
    return new Handlebars.SafeString(signoutTitle); 
};

var signoutTitle = "<span id='signout_title'>Sign Out</span>";
Template.header.customsignIn = function() {
    return new Handlebars.SafeString(signinTitle); 
};
