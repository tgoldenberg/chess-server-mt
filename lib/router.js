Router.configure({
	layoutTemplate: 'layout',
	loadingTemplate: 'loading',
	notFoundTemplate: 'notFound',
	waitOn: function() {
		return Meteor.subscribe('availableUsers');
	}
});

Router.route('/', { name: 'splash' });
Router.route('/games/:_id', {
	name: 'game',
	waitOn: function() {
		return [Meteor.subscribe('singleGame', this.params._id )];
	},
	data: function() {
		return Games.findOne(this.params._id);
	}
});
