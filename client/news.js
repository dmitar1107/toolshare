NewsList = new Meteor.Collection("news");

Template.news.newsItems = function() {
    console.log("** News ***");
    return Tools.find(Session.get( 'searchFilter' ),{sort: {location: -1}});
};

