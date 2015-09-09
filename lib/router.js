Router.configure({
	layoutTemplate: 'layout',
	loadingTemplate: 'loading',
	waitOn: function() {
		return [Meteor.subscribe('games'), Meteor.subscribe('nextGame'), Meteor.subscribe('availableUsers')]
	}
}); 

Router.route('/', {name: 'splash'})