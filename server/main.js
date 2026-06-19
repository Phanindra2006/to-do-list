import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { TasksCollection } from '/imports/api/TasksCollection'; // Verify path points to api/

const insertTask = async (taskText, category, sortOrder, userId) => {
  await TasksCollection.insertAsync({ 
    text: taskText, 
    category: category, 
    sortOrder: sortOrder,
    userId: userId, 
    isChecked: false,
    createdAt: new Date() 
  });
};

const SEED_USERNAME = 'meteorite';
const SEED_PASSWORD = 'password';

Meteor.startup(async () => {
  console.log("=== SERVER STARTUP INITIALIZED ===");

  let user = await Meteor.users.findOneAsync({ username: SEED_USERNAME });
  let activeUserId = user ? user._id : null;

  if (!user) {
    console.log(`User '${SEED_USERNAME}' not found. Creating clean account...`);
    try {
      activeUserId = Accounts.createUser({
        username: SEED_USERNAME,
        password: SEED_PASSWORD,
      });
      console.log("User successfully created with ID:", activeUserId);
    } catch (error) {
      console.error("!!! FAILED TO CREATE USER !!! Details:", error.message);
    }
  } else {
    console.log(`User '${SEED_USERNAME}' verified securely.`);
  }

  const taskCount = await TasksCollection.find().countAsync();
  console.log(`Current database task count: ${taskCount}`);

  if (taskCount === 0 && activeUserId) {
    console.log("Seeding fresh tasks for user context...");
    await insertTask('Setup Meteor Project', 'Work', 1, activeUserId);
    await insertTask('Analyze Blaze Framework Architecture', 'Work', 2, activeUserId);
    await insertTask('Practice SQL Joins & Subqueries', 'Personal', 3, activeUserId);
    await insertTask('Fix Mobile Layout Viewport', 'Urgent', 4, activeUserId);
    await insertTask('Design UI components in Figma', 'Personal', 5, activeUserId);
    console.log("Tasks seeded successfully.");
  }
  
  console.log("=== SERVER STARTUP COMPLETE ===");
});
