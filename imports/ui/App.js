import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '../db/TasksCollection'; // Verified Step 8.4 folder path
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import './App.html';
import './Task.js';
import './Login.js';

const HIDE_COMPLETED_STRING = "hideCompleted";
let draggedItemId = null; // Tracks the dragged element ID across events

const getUser = () => Meteor.user();
const isUserLogged = () => !!Meteor.userId();

// Secure filter configuration scoped directly to the logged-in user
const getTasksFilter = () => {
  const userId = Meteor.userId();
  const hideCompletedFilter = { isChecked: { $ne: true } };
  const userFilter = userId ? { userId } : { userId: "NONE" }; // Prevents data leak if unauth

  return {
    userFilter,
    pendingOnlyFilter: { ...hideCompletedFilter, ...userFilter }
  };
};

Template.mainContainer.onCreated(function mainContainerOnCreated() {
  this.state = new ReactiveDict();
  this.state.setDefault(HIDE_COMPLETED_STRING, false);
  this.incompleteCount = new ReactiveVar('');
  
  // Asynchronously tracks and recalculates the incomplete tasks badge count
  this.autorun(async () => {
    if (!isUserLogged()) {
      this.incompleteCount.set('');
      return;
    }
    const { pendingOnlyFilter } = getTasksFilter();
    const pendingCount = await TasksCollection.find(pendingOnlyFilter).countAsync();
    this.incompleteCount.set(pendingCount ? `(${pendingCount})` : '');
  });
});

Template.mainContainer.helpers({
  tasks() {
    if (!isUserLogged()) return [];

    const instance = Template.instance();
    const hideCompleted = instance.state.get(HIDE_COMPLETED_STRING);
    const { pendingOnlyFilter, userFilter } = getTasksFilter();

    // Fetches items matching the visibility filter, ordered by drag-and-drop sort order
    return TasksCollection.find(hideCompleted ? pendingOnlyFilter : userFilter, {
      sort: { sortOrder: 1 },
    });
  },
  hideCompleted() {
    return Template.instance().state.get(HIDE_COMPLETED_STRING);
  },
  isUserLogged() {
    return isUserLogged();
  },
  getUser() {
    return getUser();
  },
  incompleteCount() {
    return Template.instance().incompleteCount.get();
  }
});

Template.mainContainer.events({
  // Toggles visibility of checked/completed items
  'click #hide-completed-button'(event, instance) {
    const currentHideCompleted = instance.state.get(HIDE_COMPLETED_STRING);
    instance.state.set(HIDE_COMPLETED_STRING, !currentHideCompleted);
  },
  
  // Triggers user logout session cleanly
  'click .user'() {
    Meteor.logout();
  },
  
  // --- HTML5 Drag and Drop Event Listeners ---
  'dragstart .task-item'(event) {
    draggedItemId = event.currentTarget.dataset.id;
    event.target.style.opacity = '0.5';
  },
  
  'dragend .task-item'(event) {
    event.target.style.opacity = '1.0';
    draggedItemId = null;
  },
  
  'dragover .task-item'(event) {
    event.preventDefault(); // Required to allow drop behavior
  },
  
  'drop .task-item'(event) {
    event.preventDefault();
    const targetItemId = event.currentTarget.dataset.id;
    
    if (!draggedItemId || draggedItemId === targetItemId) return;

    // Securely executes the drag-and-drop index swap on the server
    Meteor.call('tasks.updateOrder', draggedItemId, targetItemId);
  }
});

Template.form.events({
  // Secure Form Submission using Meteor Methods
  'submit .task-form'(event) {
    event.preventDefault();
    const target = event.target;
    const text = target.text.value;
    const category = target.category.value;

    // Calls the server-side validation method instead of inserting directly on client
    Meteor.call('tasks.insert', text, category);

    target.text.value = ''; // Clears input box
  }
});
