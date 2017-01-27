Handlebars.registerHelper("getCurrentStep", function() {
    console.log("*** CurrentStep = " + Session.get( 'currentStep' ) + " ***" );
    return Session.get( 'currentStep' );
});

Handlebars.registerHelper("isAdmin", function() {
    var ret = false;
    console.log("*** CurrentStep = " + Session.get( 'currentStep' ) + " ***" );
	if ( Meteor.user() != null )
        ret = ( Meteor.user().username != "dennis_merrill" );
	return ret;
});
