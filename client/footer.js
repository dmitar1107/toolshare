Template.footer.events({
    'click .footer_item_share': function () {
        console.log("*** Share Click ***");
        Meteor.Router.to( '/social' );

    },

    'click .footer_item_news': function () {
        console.log("*** News Click ***");
        Meteor.Router.to( '/news' );

    },

    'click .footer_item_about': function () {
        console.log("*** About Click ***");
        Meteor.Router.to( '/about' );

    },

    'click .footer_item_contact': function () {
        console.log("*** Contact Click ***");
        Meteor.Router.to( '/contact' );
    }
});