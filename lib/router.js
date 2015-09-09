Router.configure({
	layoutTemplate: 'layout',
	loadingTemplate: 'loading',
	notFoundTemplate: 'notFound',
	waitOn: function() {
		return [Meteor.subscribe('availableUsers'), Meteor.subscribe('games')];
	}
});

Router.route('/', { name: 'splash' });
Router.route('/games/:_id', { name: 'game'})
