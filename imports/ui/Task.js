import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import './Task.html';

Template.task.events({
  // 8.3: Replaces database mutations with specific backend method routes
  'click .toggle-checked'() {
    Meteor.call('tasks.setIsChecked', this._id, !this.isChecked);
  },
  
  'click .delete'() {
    Meteor.call('tasks.remove', this._id);
  },
});

Template.task.helpers({
  categoryColor(category) {
    switch (category) {
      case 'Work': return '#3385ff';
      case 'Urgent': return '#ff3333';
      case 'Personal': return '#2eb82e';
      default: return '#ddd';
    }
  }
});
